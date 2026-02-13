import { AppError, ErrorCode } from "@/lib/errors";
/**
 * In-memory store for token buckets
 * In production, this should be replaced with Redis
 */
class RateLimiterStore {
    buckets = new Map();
    cleanupInterval = null;
    constructor() {
        // Cleanup old buckets every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);
    }
    /**
     * Get or create a token bucket for the given key
     */
    getBucket(key, maxTokens) {
        if (!this.buckets.has(key)) {
            this.buckets.set(key, {
                tokens: maxTokens ?? 0,
                lastRefillTime: Date.now(),
            });
        }
        return this.buckets.get(key);
    }
    /**
     * Consume tokens from a bucket
     * Returns true if tokens were consumed, false if limit exceeded
     */
    consumeTokens(key, config, tokens = 1) {
        const bucket = this.getBucket(key, config.maxTokens);
        const now = Date.now();
        const timePassed = (now - bucket.lastRefillTime) / 1000; // seconds
        // Refill tokens based on time passed
        bucket.tokens = Math.min(config.maxTokens, bucket.tokens + timePassed * config.refillRate);
        bucket.lastRefillTime = now;
        // Try to consume tokens
        if (bucket.tokens >= tokens) {
            bucket.tokens -= tokens;
            return true;
        }
        return false;
    }
    /**
     * Cleanup old buckets (older than 1 hour with no tokens)
     */
    cleanup() {
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        const keysToDelete = [];
        for (const [key, bucket] of this.buckets) {
            if (bucket.lastRefillTime < oneHourAgo && bucket.tokens === 0) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach((key) => this.buckets.delete(key));
    }
    /**
     * Clear all buckets (useful for testing)
     */
    clear() {
        this.buckets.clear();
    }
    /**
     * Shutdown cleanup interval
     */
    shutdown() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
}
// Global rate limiter store (singleton)
const store = new RateLimiterStore();
/**
 * Create a rate limiting middleware
 * @param config Rate limiter configuration
 * @returns Middleware function
 */
export function createRateLimiter(config) {
    const defaultKeyGenerator = (c) => {
        // Use X-Forwarded-For if behind a proxy, otherwise use connection IP
        const forwarded = c.req.header("x-forwarded-for");
        if (forwarded) {
            return forwarded.split(",")[0].trim();
        }
        return c.req.header("cf-connecting-ip") || "unknown";
    };
    const keyGenerator = config.keyGenerator || defaultKeyGenerator;
    return async (c, next) => {
        const key = keyGenerator(c);
        const canProceed = store.consumeTokens(key, config);
        if (!canProceed) {
            // Add rate limit headers
            c.header("Retry-After", "60");
            c.header("X-RateLimit-Limit", String(config.maxTokens));
            c.header("X-RateLimit-Remaining", "0");
            throw new AppError(ErrorCode.RATE_LIMITED, 429, "Too many requests, please try again later", { retryAfter: 60 });
        }
        // Add rate limit headers to successful responses
        c.header("X-RateLimit-Limit", String(config.maxTokens));
        c.header("X-RateLimit-Remaining", String(Math.floor(store.getBucket(key).tokens)));
        await next();
    };
}
/**
 * Shutdown the rate limiter (cleanup resources)
 */
export function shutdownRateLimiter() {
    store.shutdown();
}
/**
 * Clear all rate limit buckets (useful for testing)
 */
export function clearRateLimiter() {
    store.clear();
}
/**
 * Export the store for testing purposes
 */
export const rateLimiterStore = store;
//# sourceMappingURL=rateLimiter.js.map