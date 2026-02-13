import { getDb } from "@/db/config";
import { payment_webhook_logs } from "@/db/schema";
import { AppError, ErrorCode } from "@/lib/errors";
import { eq, and, isNull } from "drizzle-orm";

/**
 * Webhook retry configuration
 */
export interface WebhookRetryConfig {
  maxRetries: number; // Maximum number of retry attempts
  initialDelayMs: number; // Initial delay in milliseconds
  maxDelayMs: number; // Maximum delay between retries
  backoffMultiplier: number; // Multiplier for exponential backoff (e.g., 2)
  timeoutMs: number; // HTTP request timeout
}

/**
 * Default retry configuration
 */
const DEFAULT_CONFIG: WebhookRetryConfig = {
  maxRetries: 5,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 60000, // 1 minute
  backoffMultiplier: 2,
  timeoutMs: 5000, // 5 seconds
};

/**
 * Webhook event type
 */
export interface WebhookEvent {
  id: string; // Unique event ID for idempotency
  type: string; // Event type (e.g., 'payment.completed')
  url: string; // Target webhook URL
  payload: Record<string, unknown>; // Event payload
  metadata?: Record<string, unknown>; // Optional metadata
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
export class WebhookService {
  private config: WebhookRetryConfig;

  constructor(config: Partial<WebhookRetryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Dispatch a webhook with automatic retry on failure
   */
  async dispatchWebhook(event: WebhookEvent): Promise<WebhookDeliveryResult> {
    const db = getDb();
    let lastError: string | undefined;
    let lastStatusCode: number | undefined;
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
      } catch (error) {
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
  private async sendWebhook(
    event: WebhookEvent,
    attempt: number,
  ): Promise<WebhookDeliveryResult> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeoutMs,
      );

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
    } catch (error) {
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
  private calculateBackoffDelay(attemptNumber: number): number {
    const exponentialDelay = Math.min(
      this.config.initialDelayMs *
        Math.pow(this.config.backoffMultiplier, attemptNumber),
      this.config.maxDelayMs,
    );

    // Add jitter: ±10% of the delay
    const jitter = exponentialDelay * 0.1 * (Math.random() * 2 - 1);
    return Math.max(100, exponentialDelay + jitter);
  }

  /**
   * Check if error is transient (should retry)
   */
  private isTransientError(statusCode?: number): boolean {
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
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get retry configuration
   */
  getConfig(): WebhookRetryConfig {
    return { ...this.config };
  }
}

/**
 * Default webhook service instance
 */
export const webhookService = new WebhookService();
