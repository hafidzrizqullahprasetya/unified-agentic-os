import { getDb } from "@/db/config";
/**
 * Default retry configuration
 */
const DEFAULT_CONFIG = {
    maxRetries: 5,
    initialDelayMs: 1000, // 1 second
    maxDelayMs: 60000, // 1 minute
    backoffMultiplier: 2,
    timeoutMs: 5000, // 5 seconds
};
/**
 * Webhook service with retry logic
 */
export class WebhookService {
    config;
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * Dispatch a webhook with automatic retry on failure
     */
    async dispatchWebhook(event) {
        const db = getDb();
        let lastError;
        let lastStatusCode;
        let attempt = 0;
        for (attempt = 0; attempt < this.config.maxRetries; attempt++) {
            try {
                const result = await this.sendWebhook(event, attempt);
                if (result.success) {
                    return result;
                }
                lastStatusCode = result.statusCode;
                lastError = result.error;
                // Only retry on transient errors (5xx, timeouts)
                const shouldRetry = this.isTransientError(result.statusCode);
                if (!shouldRetry) {
                    // Non-transient error, don't retry
                    return result;
                }
                // Calculate next retry delay
                if (attempt < this.config.maxRetries - 1) {
                    const delay = this.calculateBackoffDelay(attempt);
                    await this.sleep(delay);
                }
            }
            catch (error) {
                lastError = error instanceof Error ? error.message : String(error);
                if (attempt < this.config.maxRetries - 1) {
                    const delay = this.calculateBackoffDelay(attempt);
                    await this.sleep(delay);
                }
            }
        }
        // All retries exhausted
        return {
            success: false,
            statusCode: lastStatusCode,
            error: lastError || "Maximum retries exhausted",
            attempt,
        };
    }
    /**
     * Send webhook to target URL
     */
    async sendWebhook(event, attempt) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);
            const response = await fetch(event.url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Webhook-ID": event.id,
                    "X-Webhook-Type": event.type,
                    "X-Webhook-Attempt": String(attempt + 1),
                },
                body: JSON.stringify({
                    id: event.id,
                    type: event.type,
                    timestamp: new Date().toISOString(),
                    payload: event.payload,
                    ...(event.metadata && { metadata: event.metadata }),
                }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (response.ok) {
                return {
                    success: true,
                    statusCode: response.status,
                    attempt,
                };
            }
            return {
                success: false,
                statusCode: response.status,
                error: `HTTP ${response.status}: ${response.statusText}`,
                attempt,
            };
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            // Check if it's a timeout
            if (errorMsg.includes("abort")) {
                return {
                    success: false,
                    error: `Request timeout after ${this.config.timeoutMs}ms`,
                    attempt,
                };
            }
            return {
                success: false,
                error: errorMsg,
                attempt,
            };
        }
    }
    /**
     * Calculate backoff delay using exponential backoff with jitter
     */
    calculateBackoffDelay(attemptNumber) {
        const exponentialDelay = Math.min(this.config.initialDelayMs *
            Math.pow(this.config.backoffMultiplier, attemptNumber), this.config.maxDelayMs);
        // Add jitter: ±10% of the delay
        const jitter = exponentialDelay * 0.1 * (Math.random() * 2 - 1);
        return Math.max(100, exponentialDelay + jitter);
    }
    /**
     * Check if error is transient (should retry)
     */
    isTransientError(statusCode) {
        if (!statusCode) {
            // Network errors are transient
            return true;
        }
        // Retry on server errors and rate limiting
        return statusCode >= 500 || statusCode === 429;
    }
    /**
     * Sleep for specified duration
     */
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * Get retry configuration
     */
    getConfig() {
        return { ...this.config };
    }
}
/**
 * Default webhook service instance
 */
export const webhookService = new WebhookService();
//# sourceMappingURL=webhook.service.js.map