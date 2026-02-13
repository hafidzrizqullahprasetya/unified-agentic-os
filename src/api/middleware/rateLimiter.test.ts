import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Context } from "hono";
import {
  createRateLimiter,
  clearRateLimiter,
  type RateLimitConfig,
} from "@/api/middleware/rateLimiter";

/**
 * Create a mock Hono Context for testing
 * Each context gets a unique IP by default to isolate rate limits
 */
function createMockContext(
  headers: Record<string, string> = {},
  uniqueId?: string,
): Context {
  const id = uniqueId || Math.random().toString(36).substring(2);
  const mockRequest = {
    method: "GET",
    path: "/test",
    header: (name: string) => {
      const lowerName = name.toLowerCase();
      if (lowerName === "cf-connecting-ip" && !headers[lowerName]) {
        return `192.168.1.${id}`;
      }
      return headers[lowerName];
    },
    headers: new Map(Object.entries(headers)),
  };

  const mockResponse = {
    headers: new Map<string, string>(),
  };

  const context: any = {
    req: mockRequest,
    res: mockResponse,
    set: vi.fn(),
    get: vi.fn(),
    header: (name: string, value?: string) => {
      if (value === undefined) {
        return mockResponse.headers.get(name);
      }
      mockResponse.headers.set(name, value);
      return context;
    },
    json: vi.fn((data, status) => ({
      json: data,
      status,
    })),
  };

  return context;
}

describe("Rate Limiting Middleware", () => {
  beforeEach(() => {
    clearRateLimiter();
  });

  afterEach(() => {
    clearRateLimiter();
  });

  describe("Token Bucket Algorithm", () => {
    it("should allow requests within rate limit", async () => {
      const config: RateLimitConfig = {
        maxTokens: 10,
        refillRate: 1,
      };

      const middleware = createRateLimiter(config);
      const c = createMockContext();
      let nextCalled = false;

      await middleware(c, async () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(true);
    });

    it("should reject requests exceeding rate limit", async () => {
      const config: RateLimitConfig = {
        maxTokens: 2,
        refillRate: 0,
      };

      const middleware = createRateLimiter(config);
      let requestCount = 0;

      // First 2 requests should succeed (use same key)
      for (let i = 0; i < 2; i++) {
        const c = createMockContext({}, "same-ip");
        try {
          await middleware(c, async () => {
            requestCount++;
          });
        } catch (error) {
          // unexpected
        }
      }

      expect(requestCount).toBe(2);

      // Third request should be rate limited
      const c = createMockContext({}, "same-ip");
      let errorThrown = false;

      try {
        await middleware(c, async () => {
          requestCount++;
        });
      } catch (error: any) {
        errorThrown = true;
      }

      expect(errorThrown).toBe(true);
      expect(requestCount).toBe(2);
    });

    it("should refill tokens over time", async () => {
      const config: RateLimitConfig = {
        maxTokens: 1,
        refillRate: 1,
      };

      const middleware = createRateLimiter(config);
      let successCount = 0;

      // First request succeeds
      const c1 = createMockContext({}, "test-1");
      await middleware(c1, async () => {
        successCount++;
      });

      // Second request fails (no tokens)
      const c2 = createMockContext({}, "test-1");
      try {
        await middleware(c2, async () => {
          successCount++;
        });
      } catch {
        // Expected
      }

      // Wait 1.1 seconds for refill
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Third request succeeds (token refilled)
      const c3 = createMockContext({}, "test-1");
      await middleware(c3, async () => {
        successCount++;
      });

      expect(successCount).toBe(2);
    });
  });

  describe("Rate Limit Headers", () => {
    it("should add rate limit headers to response", async () => {
      const config: RateLimitConfig = {
        maxTokens: 10,
        refillRate: 1,
      };

      const middleware = createRateLimiter(config);
      const c = createMockContext();

      await middleware(c, async () => {
        // noop
      });

      expect(c.header("X-RateLimit-Limit")).toBe("10");
      expect(c.header("X-RateLimit-Remaining")).toBeDefined();
    });

    it("should add Retry-After header when rate limited", async () => {
      const config: RateLimitConfig = {
        maxTokens: 1,
        refillRate: 0,
      };

      const middleware = createRateLimiter(config);

      // Use first token
      const c1 = createMockContext({}, "test-retry");
      await middleware(c1, async () => {
        // noop
      });

      // Try to exceed limit
      const c2 = createMockContext({}, "test-retry");
      try {
        await middleware(c2, async () => {
          // noop
        });
      } catch {
        // Expected
      }

      expect(c2.header("Retry-After")).toBe("60");
    });
  });

  describe("Custom Key Generation", () => {
    it("should use custom key generator", async () => {
      const keys: string[] = [];
      const config: RateLimitConfig = {
        maxTokens: 1,
        refillRate: 0,
        keyGenerator: (c) => {
          const key = c.req.header("x-user-id") || "unknown";
          keys.push(key);
          return key;
        },
      };

      const middleware = createRateLimiter(config);

      // Request 1 with user-1
      const c1 = createMockContext({ "x-user-id": "user-1" });
      await middleware(c1, async () => {
        // noop
      });

      // Request 2 with user-1 (should be rate limited)
      const c2 = createMockContext({ "x-user-id": "user-1" });
      try {
        await middleware(c2, async () => {
          // noop
        });
        expect.fail("Should have thrown rate limit error");
      } catch {
        // Expected
      }

      // Request 3 with user-2 (should succeed, different user)
      const c3 = createMockContext({ "x-user-id": "user-2" });
      await middleware(c3, async () => {
        // noop
      });

      expect(keys).toEqual(["user-1", "user-1", "user-2"]);
    });
  });

  describe("Error Details", () => {
    it("should include retry context in error", async () => {
      const config: RateLimitConfig = {
        maxTokens: 1,
        refillRate: 0,
      };

      const middleware = createRateLimiter(config);

      // Use token
      const c1 = createMockContext({}, "err-test");
      await middleware(c1, async () => {
        // noop
      });

      // Exceed limit
      const c2 = createMockContext({}, "err-test");
      try {
        await middleware(c2, async () => {
          // noop
        });
      } catch (error: any) {
        expect(error.context).toBeDefined();
        expect(error.context.retryAfter).toBe(60);
      }
    });
  });

  describe("Concurrent Requests", () => {
    it("should handle concurrent requests correctly", async () => {
      const config: RateLimitConfig = {
        maxTokens: 5,
        refillRate: 0,
      };

      const middleware = createRateLimiter(config);
      let successCount = 0;
      let failureCount = 0;

      // Send 10 concurrent requests with same key
      const promises = Array.from({ length: 10 }).map(async (_, i) => {
        const c = createMockContext({}, "concurrent-test");
        try {
          await middleware(c, async () => {
            successCount++;
          });
        } catch {
          failureCount++;
        }
      });

      await Promise.all(promises);

      // Should allow 5, reject 5
      expect(successCount).toBe(5);
      expect(failureCount).toBe(5);
    });
  });

  describe("Rate Limit Configuration", () => {
    it("should allow configurable max tokens", async () => {
      const config: RateLimitConfig = {
        maxTokens: 10,
        refillRate: 0,
      };

      const middleware = createRateLimiter(config);
      let count = 0;

      // Should allow 10 requests
      for (let i = 0; i < 10; i++) {
        const c = createMockContext({}, "config-test");
        try {
          await middleware(c, async () => {
            count++;
          });
        } catch {
          break;
        }
      }

      expect(count).toBe(10);

      // 11th should fail
      const c = createMockContext({}, "config-test");
      try {
        await middleware(c, async () => {
          count++;
        });
        expect.fail("Should be rate limited");
      } catch {
        // Expected
      }

      expect(count).toBe(10);
    });

    it("should allow configurable refill rate", async () => {
      const config: RateLimitConfig = {
        maxTokens: 1,
        refillRate: 10,
      };

      const middleware = createRateLimiter(config);

      // First request succeeds
      const c1 = createMockContext({}, "refill-test");
      await middleware(c1, async () => {
        // noop
      });

      // Second request fails
      const c2 = createMockContext({}, "refill-test");
      try {
        await middleware(c2, async () => {
          // noop
        });
        expect.fail("Should be rate limited");
      } catch {
        // Expected
      }

      // Wait 100ms (1 token at 10 tokens/sec)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Third request succeeds (token refilled)
      const c3 = createMockContext({}, "refill-test");
      await middleware(c3, async () => {
        // noop
      });
    });
  });
});
