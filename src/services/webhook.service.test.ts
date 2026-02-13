import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  WebhookService,
  type WebhookEvent,
  type WebhookRetryConfig,
} from "@/services/webhook.service";

// Mock fetch globally
global.fetch = vi.fn();

describe("Webhook Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Webhook Dispatch", () => {
    it("should successfully deliver webhook on first attempt", async () => {
      const service = new WebhookService();
      const event: WebhookEvent = {
        id: "evt_123",
        type: "payment.completed",
        url: "https://example.com/webhook",
        payload: { orderId: 123, amount: 50000 },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
      });

      const result = await service.dispatchWebhook(event);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.attempt).toBe(0);
    });

    it("should include correct headers in webhook request", async () => {
      const service = new WebhookService();
      const event: WebhookEvent = {
        id: "evt_456",
        type: "order.created",
        url: "https://api.example.com/hooks",
        payload: { customerId: 456 },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
      });

      await service.dispatchWebhook(event);

      const call = (global.fetch as any).mock.calls[0];
      const headers = call[1].headers;

      expect(headers["Content-Type"]).toBe("application/json");
      expect(headers["X-Webhook-ID"]).toBe("evt_456");
      expect(headers["X-Webhook-Type"]).toBe("order.created");
      expect(headers["X-Webhook-Attempt"]).toBe("1");
    });

    it("should include event metadata in webhook body", async () => {
      const service = new WebhookService();
      const event: WebhookEvent = {
        id: "evt_789",
        type: "payment.completed",
        url: "https://example.com/webhook",
        payload: { amount: 100000 },
        metadata: { userId: "user_123", storeId: "store_456" },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
      });

      await service.dispatchWebhook(event);

      const call = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(call[1].body);

      expect(body.id).toBe("evt_789");
      expect(body.type).toBe("payment.completed");
      expect(body.payload).toEqual({ amount: 100000 });
      expect(body.metadata).toEqual({
        userId: "user_123",
        storeId: "store_456",
      });
      expect(body.timestamp).toBeDefined();
    });
  });

  describe("Retry Logic", () => {
    it("should retry on 5xx errors", async () => {
      const config: WebhookRetryConfig = {
        maxRetries: 3,
        initialDelayMs: 10,
        maxDelayMs: 100,
        backoffMultiplier: 2,
        timeoutMs: 5000,
      };

      const service = new WebhookService(config);
      const event: WebhookEvent = {
        id: "evt_500",
        type: "test.event",
        url: "https://example.com/webhook",
        payload: {},
      };

      // Fail twice, succeed on third
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Server Error",
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: "Service Unavailable",
        })
        .mockResolvedValueOnce({ ok: true, status: 200 });

      const result = await service.dispatchWebhook(event);

      expect(result.success).toBe(true);
      expect(result.attempt).toBe(2);
      expect((global.fetch as any).mock.calls.length).toBe(3);
    });

    it("should not retry on 4xx errors", async () => {
      const service = new WebhookService();
      const event: WebhookEvent = {
        id: "evt_400",
        type: "test.event",
        url: "https://example.com/webhook",
        payload: {},
      };

      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
      });

      const result = await service.dispatchWebhook(event);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(400);
      expect(result.attempt).toBe(0);
      expect((global.fetch as any).mock.calls.length).toBe(1);
    });

    it("should retry on network errors", async () => {
      const config: WebhookRetryConfig = {
        maxRetries: 3,
        initialDelayMs: 10,
        maxDelayMs: 100,
        backoffMultiplier: 2,
        timeoutMs: 5000,
      };

      const service = new WebhookService(config);
      const event: WebhookEvent = {
        id: "evt_net",
        type: "test.event",
        url: "https://example.com/webhook",
        payload: {},
      };

      // Network error, then success
      (global.fetch as any)
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({ ok: true, status: 200 });

      const result = await service.dispatchWebhook(event);

      expect(result.success).toBe(true);
      expect(result.attempt).toBe(1);
      expect((global.fetch as any).mock.calls.length).toBe(2);
    });

    it("should exhaust max retries", async () => {
      const config: WebhookRetryConfig = {
        maxRetries: 3,
        initialDelayMs: 10,
        maxDelayMs: 100,
        backoffMultiplier: 2,
        timeoutMs: 5000,
      };

      const service = new WebhookService(config);
      const event: WebhookEvent = {
        id: "evt_exhaust",
        type: "test.event",
        url: "https://example.com/webhook",
        payload: {},
      };

      // Always fail
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Server Error",
      });

      const result = await service.dispatchWebhook(event);

      expect(result.success).toBe(false);
      expect(result.attempt).toBe(3);
      expect((global.fetch as any).mock.calls.length).toBe(3);
    });
  });

  describe("Exponential Backoff", () => {
    it("should calculate increasing delays", async () => {
      const config: WebhookRetryConfig = {
        maxRetries: 4,
        initialDelayMs: 100,
        maxDelayMs: 1000,
        backoffMultiplier: 2,
        timeoutMs: 5000,
      };

      const service = new WebhookService(config);
      const event: WebhookEvent = {
        id: "evt_backoff",
        type: "test.event",
        url: "https://example.com/webhook",
        payload: {},
      };

      // Always fail with 5xx
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const startTime = Date.now();
      await service.dispatchWebhook(event);
      const duration = Date.now() - startTime;

      // Should have delays: 100ms, 200ms, 400ms = 700ms minimum
      // With jitter, could be more, so just check it's reasonable
      expect(duration).toBeGreaterThan(600);
      expect(duration).toBeLessThan(2000);
    });

    it("should respect max delay limit", async () => {
      const config: WebhookRetryConfig = {
        maxRetries: 5,
        initialDelayMs: 1000,
        maxDelayMs: 100, // Max is less than initial!
        backoffMultiplier: 2,
        timeoutMs: 5000,
      };

      const service = new WebhookService(config);
      const event: WebhookEvent = {
        id: "evt_maxdelay",
        type: "test.event",
        url: "https://example.com/webhook",
        payload: {},
      };

      // Always fail
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const startTime = Date.now();
      await service.dispatchWebhook(event);
      const duration = Date.now() - startTime;

      // With max delay of 100ms, should be quick
      expect(duration).toBeLessThan(1000);
    });
  });

  describe("Timeout Handling", () => {
    it("should handle request timeout", async () => {
      const config: WebhookRetryConfig = {
        maxRetries: 2,
        initialDelayMs: 10,
        maxDelayMs: 100,
        backoffMultiplier: 2,
        timeoutMs: 5000,
      };

      const service = new WebhookService(config);
      const event: WebhookEvent = {
        id: "evt_timeout",
        type: "test.event",
        url: "https://example.com/webhook",
        payload: {},
      };

      // Timeout on first attempt, success on second
      (global.fetch as any)
        .mockRejectedValueOnce(new Error("The operation was aborted"))
        .mockResolvedValueOnce({ ok: true, status: 200 });

      const result = await service.dispatchWebhook(event);

      expect(result.success).toBe(true);
      expect(result.attempt).toBe(1);
    });

    it("should include timeout in error message", async () => {
      const service = new WebhookService();
      const event: WebhookEvent = {
        id: "evt_timeout_err",
        type: "test.event",
        url: "https://example.com/webhook",
        payload: {},
      };

      (global.fetch as any).mockRejectedValue(
        new Error("The operation was aborted"),
      );

      const result = await service.dispatchWebhook(event);

      expect(result.success).toBe(false);
      expect(result.error).toContain("timeout");
    });
  });

  describe("Webhook Event", () => {
    it("should support optional metadata", async () => {
      const service = new WebhookService();
      const event: WebhookEvent = {
        id: "evt_meta",
        type: "order.updated",
        url: "https://example.com/webhook",
        payload: { orderId: 789 },
        metadata: { source: "api", version: "1.0" },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
      });

      const result = await service.dispatchWebhook(event);

      expect(result.success).toBe(true);
    });

    it("should handle events without metadata", async () => {
      const service = new WebhookService();
      const event: WebhookEvent = {
        id: "evt_nometa",
        type: "payment.completed",
        url: "https://example.com/webhook",
        payload: { amount: 25000 },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
      });

      const result = await service.dispatchWebhook(event);

      expect(result.success).toBe(true);

      const call = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(call[1].body);

      expect(body.metadata).toBeUndefined();
    });
  });

  describe("Configuration", () => {
    it("should use provided configuration", () => {
      const config: WebhookRetryConfig = {
        maxRetries: 10,
        initialDelayMs: 500,
        maxDelayMs: 5000,
        backoffMultiplier: 3,
        timeoutMs: 10000,
      };

      const service = new WebhookService(config);
      const retrievedConfig = service.getConfig();

      expect(retrievedConfig).toEqual(config);
    });

    it("should use default configuration when not provided", () => {
      const service = new WebhookService();
      const config = service.getConfig();

      expect(config.maxRetries).toBeGreaterThan(0);
      expect(config.initialDelayMs).toBeGreaterThan(0);
      expect(config.maxDelayMs).toBeGreaterThan(config.initialDelayMs);
      expect(config.backoffMultiplier).toBeGreaterThan(1);
      expect(config.timeoutMs).toBeGreaterThan(0);
    });

    it("should merge custom config with defaults", () => {
      const service = new WebhookService({ maxRetries: 10 });
      const config = service.getConfig();

      expect(config.maxRetries).toBe(10);
      expect(config.initialDelayMs).toBeGreaterThan(0); // From default
      expect(config.timeoutMs).toBeGreaterThan(0); // From default
    });
  });

  describe("Error Messages", () => {
    it("should provide clear error messages", async () => {
      const service = new WebhookService();
      const event: WebhookEvent = {
        id: "evt_errmsg",
        type: "test.event",
        url: "https://example.com/webhook",
        payload: {},
      };

      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      const result = await service.dispatchWebhook(event);

      expect(result.error).toContain("404");
      expect(result.error).toContain("Not Found");
    });

    it("should include network error details", async () => {
      const service = new WebhookService();
      const event: WebhookEvent = {
        id: "evt_neterr",
        type: "test.event",
        url: "https://example.com/webhook",
        payload: {},
      };

      const errorMsg = "Connection refused";
      (global.fetch as any).mockRejectedValue(new Error(errorMsg));

      const result = await service.dispatchWebhook(event);

      expect(result.error).toContain(errorMsg);
    });
  });

  describe("Rate Limiting (429)", () => {
    it("should retry on 429 Too Many Requests", async () => {
      const config: WebhookRetryConfig = {
        maxRetries: 3,
        initialDelayMs: 10,
        maxDelayMs: 100,
        backoffMultiplier: 2,
        timeoutMs: 5000,
      };

      const service = new WebhookService(config);
      const event: WebhookEvent = {
        id: "evt_429",
        type: "test.event",
        url: "https://example.com/webhook",
        payload: {},
      };

      // Rate limited, then success
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: "Too Many Requests",
        })
        .mockResolvedValueOnce({ ok: true, status: 200 });

      const result = await service.dispatchWebhook(event);

      expect(result.success).toBe(true);
      expect(result.attempt).toBe(1);
      expect((global.fetch as any).mock.calls.length).toBe(2);
    });
  });

  describe("Webhook Attempt Tracking", () => {
    it("should track attempt number", async () => {
      const config: WebhookRetryConfig = {
        maxRetries: 3,
        initialDelayMs: 10,
        maxDelayMs: 100,
        backoffMultiplier: 2,
        timeoutMs: 5000,
      };

      const service = new WebhookService(config);
      const event: WebhookEvent = {
        id: "evt_attempts",
        type: "test.event",
        url: "https://example.com/webhook",
        payload: {},
      };

      // Fail 2 times, then succeed
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: true, status: 200 });

      const result = await service.dispatchWebhook(event);

      expect(result.success).toBe(true);
      expect(result.attempt).toBe(2);

      // Check that attempt numbers were sent in headers
      const calls = (global.fetch as any).mock.calls;
      expect(calls[0][1].headers["X-Webhook-Attempt"]).toBe("1");
      expect(calls[1][1].headers["X-Webhook-Attempt"]).toBe("2");
      expect(calls[2][1].headers["X-Webhook-Attempt"]).toBe("3");
    });
  });
});
