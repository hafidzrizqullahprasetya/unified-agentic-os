import { Context, Next } from "hono";
/**
 * Token bucket rate limiter configuration
 */
export interface RateLimitConfig {
    maxTokens: number;
    refillRate: number;
    keyGenerator?: (c: Context) => string;
}
/**
 * Token bucket state
 */
interface TokenBucket {
    tokens: number;
    lastRefillTime: number;
}
/**
 * In-memory store for token buckets
 * In production, this should be replaced with Redis
 */
declare class RateLimiterStore {
    private buckets;
    private cleanupInterval;
    constructor();
    /**
     * Get or create a token bucket for the given key
     */
    getBucket(key: string, maxTokens?: number): TokenBucket;
    /**
     * Consume tokens from a bucket
     * Returns true if tokens were consumed, false if limit exceeded
     */
    consumeTokens(key: string, config: RateLimitConfig, tokens?: number): boolean;
    /**
     * Cleanup old buckets (older than 1 hour with no tokens)
     */
    private cleanup;
    /**
     * Clear all buckets (useful for testing)
     */
    clear(): void;
    /**
     * Shutdown cleanup interval
     */
    shutdown(): void;
}
/**
 * Create a rate limiting middleware
 * @param config Rate limiter configuration
 * @returns Middleware function
 */
export declare function createRateLimiter(config: RateLimitConfig): (c: Context, next: Next) => Promise<void>;
/**
 * Shutdown the rate limiter (cleanup resources)
 */
export declare function shutdownRateLimiter(): void;
/**
 * Clear all rate limit buckets (useful for testing)
 */
export declare function clearRateLimiter(): void;
/**
 * Export the store for testing purposes
 */
export declare const rateLimiterStore: RateLimiterStore;
export {};
//# sourceMappingURL=rateLimiter.d.ts.map