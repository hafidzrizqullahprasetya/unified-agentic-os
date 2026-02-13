/**
 * Request ID middleware
 * Generates a unique ID for each request and adds it to response headers
 * Useful for request tracing and debugging
 */
export async function requestIdMiddleware(c, next) {
    // Generate or extract request ID
    const requestId = c.req.header("x-request-id") || generateRequestId();
    // Store in context for access in handlers
    c.set("requestId", requestId);
    // Add to response headers
    c.header("X-Request-ID", requestId);
    // Log request with ID
    const method = c.req.method;
    const path = c.req.path;
    console.log(`[${requestId}] ${method} ${path}`);
    await next();
}
/**
 * Generate a unique request ID
 * Uses UUID v4 by default, but falls back to timestamp-based ID if crypto not available
 */
function generateRequestId() {
    try {
        // Try to use uuid from crypto module (Node.js 15+)
        const { randomUUID } = require("crypto");
        return randomUUID();
    }
    catch {
        // Fallback: use timestamp + random suffix
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `${timestamp}-${random}`;
    }
}
/**
 * Get request ID from context
 * Useful in handlers and services for logging
 */
export function getRequestId(c) {
    return c.get("requestId") || "unknown";
}
//# sourceMappingURL=requestId.js.map