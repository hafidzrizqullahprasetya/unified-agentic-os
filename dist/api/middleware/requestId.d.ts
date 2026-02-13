import { Context, Next } from "hono";
/**
 * Request ID middleware
 * Generates a unique ID for each request and adds it to response headers
 * Useful for request tracing and debugging
 */
export declare function requestIdMiddleware(c: Context, next: Next): Promise<void>;
/**
 * Get request ID from context
 * Useful in handlers and services for logging
 */
export declare function getRequestId(c: Context): string;
//# sourceMappingURL=requestId.d.ts.map