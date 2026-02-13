/**
 * Webhook retry configuration
 */
export interface WebhookRetryConfig {
    maxRetries: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
    timeoutMs: number;
}
/**
 * Webhook event type
 */
export interface WebhookEvent {
    id: string;
    type: string;
    url: string;
    payload: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}
/**
 * Webhook delivery attempt result
 */
interface WebhookDeliveryResult {
    success: boolean;
    statusCode?: number;
    error?: string;
    attempt: number;
    nextRetryAt?: Date;
}
/**
 * Webhook service with retry logic
 */
export declare class WebhookService {
    private config;
    constructor(config?: Partial<WebhookRetryConfig>);
    /**
     * Dispatch a webhook with automatic retry on failure
     */
    dispatchWebhook(event: WebhookEvent): Promise<WebhookDeliveryResult>;
    /**
     * Send webhook to target URL
     */
    private sendWebhook;
    /**
     * Calculate backoff delay using exponential backoff with jitter
     */
    private calculateBackoffDelay;
    /**
     * Check if error is transient (should retry)
     */
    private isTransientError;
    /**
     * Sleep for specified duration
     */
    private sleep;
    /**
     * Get retry configuration
     */
    getConfig(): WebhookRetryConfig;
}
/**
 * Default webhook service instance
 */
export declare const webhookService: WebhookService;
export {};
//# sourceMappingURL=webhook.service.d.ts.map