# Implementation Notes: Deep Dive OpenClaw Source Code

**Date**: February 10, 2026  
**Project**: Unified-Agentic-OS  
**Session**: Day 5-7 Research (Code Analysis)  
**Status**: Detailed pattern extraction from OpenClaw (5 patterns analyzed)

---

## TABLE OF CONTENTS

1. [Pattern 1: Plugin Registry (Dynamic Registration)](#pattern-1-plugin-registry)
2. [Pattern 2: Dependency Injection (Service Architecture)](#pattern-2-dependency-injection)
3. [Pattern 3: Event-Driven Architecture (Messaging System)](#pattern-3-event-driven-architecture)
4. [Pattern 4: Error Handling (Structured Errors)](#pattern-4-error-handling)
5. [Pattern 5: Retry Logic (Exponential Backoff)](#pattern-5-retry-logic)
6. [Architecture Insights](#architecture-insights)
7. [Implementation Strategy](#implementation-strategy)

---

## PATTERN 1: PLUGIN REGISTRY

### Location in OpenClaw
- **File**: `src/plugins/registry.ts` (core registry implementation)
- **Related**: `src/channels/registry.ts` (channel registry), `src/cli/deps.ts` (CLI deps)

### How It Works

OpenClaw uses a **dynamic plugin registry** that separates core code from extensions without modifying the core.

```typescript
// src/plugins/registry.ts (simplified)
export type PluginRecord = {
  id: string;
  name: string;
  version?: string;
  kind?: PluginKind;
  source: string;
  origin: PluginOrigin;
  enabled: boolean;
  status: "loaded" | "disabled" | "error";
  toolNames: string[];        // ← Dynamic registrations
  hookNames: string[];        // ← Dynamic hooks
  channelIds: string[];       // ← Channel plugins
  gatewayMethods: string[];   // ← Gateway handlers
  cliCommands: string[];      // ← CLI commands
  services: string[];         // ← Services
  commands: string[];         // ← Commands
  configSchema: boolean;
  configJsonSchema?: Record<string, unknown>;
};

export type PluginRegistry = {
  plugins: PluginRecord[];
  tools: PluginToolRegistration[];
  hooks: PluginHookRegistration[];
  channels: PluginChannelRegistration[];
  providers: PluginProviderRegistration[];
  gatewayHandlers: GatewayRequestHandlers;
  httpHandlers: PluginHttpRegistration[];
  httpRoutes: PluginHttpRouteRegistration[];
  cliRegistrars: PluginCliRegistration[];
  services: PluginServiceRegistration[];
  commands: PluginCommandRegistration[];
  diagnostics: PluginDiagnostic[];
};

// Create registry instance
export function createPluginRegistry(registryParams: PluginRegistryParams) {
  const registry: PluginRegistry = {
    plugins: [],
    tools: [],
    hooks: [],
    channels: [],
    providers: [],
    gatewayHandlers: {},
    httpHandlers: [],
    httpRoutes: [],
    cliRegistrars: [],
    services: [],
    commands: [],
    diagnostics: [],
  };
  
  // Returns registry with register* functions
  return {
    registerTool,
    registerHook,
    registerChannel,
    registerProvider,
    registerGatewayHandler,
    registerHttpHandler,
    registerHttpRoute,
    registerCliCommand,
    registerService,
    registerCommand,
  };
}
```

### Key Insights

1. **Separation of Concerns**: Core system doesn't know about plugins; plugins register with core.
2. **Plugin Origin**: Tracks whether plugin is "core", "built-in", or "external"
3. **Status Tracking**: Each plugin tracks loading status (loaded/disabled/error)
4. **Diagnostics**: Registry maintains diagnostics log for each plugin
5. **Multiple Registration Types**: Tools, hooks, channels, providers, gateway handlers, etc.

### How I'll Implement It for Commerce

```typescript
// payment-gateways/registry.ts
export type PaymentGatewayPlugin = {
  id: string;                    // 'stripe', 'xendit', 'qris'
  name: string;
  version: string;
  provider: PaymentProvider;     // Actual implementation
  enabled: boolean;
  config: GatewayConfig;
  supportedMethods: PaymentMethod[];  // 'card', 'bank_transfer', 'ewallet'
};

export type CommercePluginRegistry = {
  gateways: PaymentGatewayPlugin[];
  handlers: EventHandler[];      // Order handlers, payment handlers, etc.
  channels: ChannelPlugin[];      // WhatsApp, Telegram, Discord
  workflows: WorkflowPlugin[];    // Order flow, payment flow, shipping flow
};

export function createCommercePluginRegistry(): CommercePluginRegistry {
  const registry: CommercePluginRegistry = {
    gateways: [],
    handlers: [],
    channels: [],
    workflows: [],
  };
  
  return {
    registerGateway: (plugin: PaymentGatewayPlugin) => {
      registry.gateways.push(plugin);
    },
    registerEventHandler: (handler: EventHandler) => {
      registry.handlers.push(handler);
    },
    registerChannel: (channel: ChannelPlugin) => {
      registry.channels.push(channel);
    },
    registerWorkflow: (workflow: WorkflowPlugin) => {
      registry.workflows.push(workflow);
    },
    getGateway: (id: string) => registry.gateways.find(g => g.id === id),
    getChannel: (id: string) => registry.channels.find(c => c.id === id),
    listGateways: () => registry.gateways.filter(g => g.enabled),
  };
}
```

---

## PATTERN 2: DEPENDENCY INJECTION

### Location in OpenClaw
- **File**: `src/cli/deps.ts` (CLI dependency injection)
- **Pattern**: Service locator with factory functions

### How It Works

OpenClaw uses a **simple, explicit DI pattern** without a heavy container. Dependencies are passed as function arguments.

```typescript
// src/cli/deps.ts (actual OpenClaw code)
export type CliDeps = {
  sendMessageWhatsApp: typeof sendMessageWhatsApp;
  sendMessageTelegram: typeof sendMessageTelegram;
  sendMessageDiscord: typeof sendMessageDiscord;
  sendMessageSlack: typeof sendMessageSlack;
  sendMessageSignal: typeof sendMessageSignal;
  sendMessageIMessage: typeof sendMessageIMessage;
};

export function createDefaultDeps(): CliDeps {
  return {
    sendMessageWhatsApp,
    sendMessageTelegram,
    sendMessageDiscord,
    sendMessageSlack,
    sendMessageSignal,
    sendMessageIMessage,
  };
}

// Provider docking: extend when adding new channels
export function createOutboundSendDeps(deps: CliDeps): OutboundSendDeps {
  return {
    sendWhatsApp: deps.sendMessageWhatsApp,
    sendTelegram: deps.sendMessageTelegram,
    sendDiscord: deps.sendMessageDiscord,
    sendSlack: deps.sendMessageSlack,
    sendSignal: deps.sendMessageSignal,
    sendIMessage: deps.sendMessageIMessage,
  };
}
```

### Key Insights

1. **Explicit Over Magic**: Dependencies are clearly typed, no reflection or decorators
2. **Factory Functions**: `createDefaultDeps()` creates instances
3. **Adapter Functions**: Can transform one dependency interface to another (e.g., `createOutboundSendDeps`)
4. **Type Safety**: All dependencies are typed, caught at compile time
5. **Testability**: Easy to mock/stub dependencies for testing

### How I'll Implement It for Commerce

```typescript
// src/di/create-deps.ts
import type { Database } from "drizzle-orm";
import { createPaymentService } from "../services/payment.service";
import { createOrderService } from "../services/order.service";
import { createCustomerService } from "../services/customer.service";
import { createInventoryService } from "../services/inventory.service";
import { createWorkflowEngine } from "../workflow/engine";
import { createEventBus } from "../events/bus";

export type CommerceDeps = {
  // Services
  paymentService: ReturnType<typeof createPaymentService>;
  orderService: ReturnType<typeof createOrderService>;
  customerService: ReturnType<typeof createCustomerService>;
  inventoryService: ReturnType<typeof createInventoryService>;
  
  // Core
  workflowEngine: ReturnType<typeof createWorkflowEngine>;
  eventBus: ReturnType<typeof createEventBus>;
  
  // Database
  db: Database;
};

export function createDefaultDeps(db: Database): CommerceDeps {
  // Create event bus first (everything depends on it)
  const eventBus = createEventBus();
  
  // Create services
  const customerService = createCustomerService(db);
  const inventoryService = createInventoryService(db);
  const orderService = createOrderService(db, eventBus);
  const paymentService = createPaymentService(db, eventBus);
  
  // Create workflow engine
  const workflowEngine = createWorkflowEngine({
    eventBus,
    orderService,
    paymentService,
    inventoryService,
    customerService,
  });
  
  // Subscribe workflows to events
  paymentService.onPaymentConfirmed((payment) => {
    workflowEngine.transition(payment.orderId, 'paid');
  });
  
  inventoryService.onInventoryReserved((event) => {
    eventBus.emit('inventory:reserved', event);
  });
  
  return {
    paymentService,
    orderService,
    customerService,
    inventoryService,
    workflowEngine,
    eventBus,
    db,
  };
}

// Usage in different modules
export async function initializeGateway(db: Database) {
  const deps = createDefaultDeps(db);
  
  // Inject dependencies into handlers
  const paymentHandler = createPaymentWebhookHandler(deps);
  const orderHandler = createOrderCommandHandler(deps);
  
  return { deps, handlers: { paymentHandler, orderHandler } };
}

// Testing: easy to mock
export function createMockDeps(): CommerceDeps {
  const mockDb = {/* mock database */};
  const mockEventBus = {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  };
  
  return {
    paymentService: {
      process: vi.fn(),
      refund: vi.fn(),
    },
    orderService: {
      create: vi.fn(),
      getById: vi.fn(),
    },
    customerService: {
      getById: vi.fn(),
      create: vi.fn(),
    },
    inventoryService: {
      reserve: vi.fn(),
      release: vi.fn(),
    },
    workflowEngine: {
      transition: vi.fn(),
      getState: vi.fn(),
    },
    eventBus: mockEventBus,
    db: mockDb,
  };
}
```

---

## PATTERN 3: EVENT-DRIVEN ARCHITECTURE

### Location in OpenClaw
- **File**: Not explicitly in a single file; spread across channel handlers
- **Pattern**: Event emission and subscription system
- **Example**: Discord gateway registry, channel handlers

### How It Works

OpenClaw uses an **event-driven system** where components emit events and other components listen.

```typescript
// Conceptual (not from one file, but the pattern)
// src/channels/plugins/types.ts
export type ChannelEvent = {
  type: 'message' | 'reaction' | 'channel_created' | 'user_joined';
  channelId: string;
  timestamp: Date;
  data: any;
};

// src/gateway/gateway.ts (conceptual)
export type EventHandler = (event: ChannelEvent) => Promise<void>;

export class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  
  on(eventType: string, handler: EventHandler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }
  
  async emit(event: ChannelEvent) {
    const handlers = this.handlers.get(event.type) || [];
    await Promise.all(handlers.map(h => h(event)));
  }
}

// Channel emits event
export async function sendMessage(message: Message) {
  // ... send implementation
  
  await eventBus.emit({
    type: 'message:sent',
    channelId: 'whatsapp',
    timestamp: new Date(),
    data: message,
  });
}

// Other modules listen
eventBus.on('message:sent', async (event) => {
  // Log to database
  await db.insert(sentMessages).values({
    channelId: event.channelId,
    messageId: event.data.id,
    timestamp: event.timestamp,
  });
});
```

### Key Insights

1. **Loose Coupling**: Sender doesn't know about receivers
2. **Type Safety**: Events are typed (TypeScript)
3. **Async**: Handlers are async, can be awaited
4. **Multiple Handlers**: Multiple modules can listen to same event
5. **Clean Separation**: Business logic separated from side effects

### How I'll Implement It for Commerce

```typescript
// src/events/types.ts
export type CommerceEvent = 
  // Customer events
  | { type: 'customer:created'; customerId: string; email: string }
  | { type: 'customer:updated'; customerId: string; changes: Record<string, any> }
  
  // Order events
  | { type: 'order:created'; orderId: string; customerId: string; items: OrderItem[] }
  | { type: 'order:payment_initiated'; orderId: string; amount: Amount }
  | { type: 'order:payment_confirmed'; orderId: string; paymentId: string }
  | { type: 'order:payment_failed'; orderId: string; reason: string }
  | { type: 'order:packed'; orderId: string; trackingNumber: string }
  | { type: 'order:shipped'; orderId: string; courierName: string }
  | { type: 'order:delivered'; orderId: string; receivedAt: Date }
  | { type: 'order:cancelled'; orderId: string; reason: string }
  
  // Payment events
  | { type: 'payment:processed'; paymentId: string; gateway: string; amount: Amount }
  | { type: 'payment:webhook_received'; paymentId: string; rawPayload: any }
  
  // Inventory events
  | { type: 'inventory:reserved'; productId: string; quantity: number; orderId: string }
  | { type: 'inventory:released'; productId: string; quantity: number; orderId: string }
  | { type: 'inventory:low_stock'; productId: string; currentStock: number; reorderLevel: number }
  
  // AI Agent events
  | { type: 'agent:message_received'; customerId: string; text: string; channel: string }
  | { type: 'agent:recommendation_given'; customerId: string; productIds: string[] }
  
  // Workflow events
  | { type: 'workflow:state_changed'; orderId: string; from: string; to: string };

// src/events/bus.ts
export type EventHandler<T extends CommerceEvent = CommerceEvent> = (event: T) => Promise<void>;

export class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  private eventLog: CommerceEvent[] = []; // For audit trail
  
  on<T extends CommerceEvent>(
    eventType: T['type'],
    handler: EventHandler<T>
  ): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    const handlerList = this.handlers.get(eventType)!;
    handlerList.push(handler as EventHandler);
    
    // Return unsubscribe function
    return () => {
      const idx = handlerList.indexOf(handler as EventHandler);
      if (idx > -1) handlerList.splice(idx, 1);
    };
  }
  
  async emit<T extends CommerceEvent>(event: T): Promise<void> {
    // Log event for audit trail
    this.eventLog.push(event);
    
    // Emit to all listeners
    const handlers = this.handlers.get(event.type) || [];
    
    // Could be sequential or parallel depending on needs
    // Parallel for speed:
    await Promise.all(handlers.map(h => h(event)));
    
    // Or sequential for ordering:
    // for (const handler of handlers) {
    //   await handler(event);
    // }
  }
  
  getEventLog(): CommerceEvent[] {
    return [...this.eventLog];
  }
}

// Usage: Commerce services emit events
export class OrderService {
  constructor(private db: Database, private eventBus: EventBus) {}
  
  async createOrder(customerId: string, items: OrderItem[]): Promise<Order> {
    // Create order in database
    const order = await this.db.insert(orders).values({
      customerId,
      status: 'initiated',
      createdAt: new Date(),
    }).returning();
    
    // Emit event (other modules listen)
    await this.eventBus.emit({
      type: 'order:created',
      orderId: order.id,
      customerId,
      items,
    });
    
    return order;
  }
  
  async confirmPayment(orderId: string, paymentId: string): Promise<void> {
    // Update order status
    await this.db.update(orders)
      .set({ status: 'paid', paymentId })
      .where(eq(orders.id, orderId));
    
    // Emit event
    await this.eventBus.emit({
      type: 'order:payment_confirmed',
      orderId,
      paymentId,
    });
  }
}

// Usage: Listeners do their work when events emit
export function setupEventHandlers(deps: CommerceDeps) {
  const { eventBus, db } = deps;
  
  // When order created, reserve inventory
  eventBus.on('order:created', async (event) => {
    for (const item of event.items) {
      await deps.inventoryService.reserve(item.productId, item.quantity, event.orderId);
    }
  });
  
  // When payment confirmed, pack order
  eventBus.on('order:payment_confirmed', async (event) => {
    // Notify warehouse
    console.log(`[WAREHOUSE] Pack order ${event.orderId}`);
    
    // Update order status after packing
    await db.update(orders)
      .set({ status: 'packed', packedAt: new Date() })
      .where(eq(orders.id, event.orderId));
  });
  
  // When order shipped, notify customer
  eventBus.on('order:shipped', async (event) => {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, event.orderId),
      with: { customer: true },
    });
    
    if (order?.customer) {
      // Send message to customer
      await deps.sendMessage({
        customerId: order.customerId,
        text: `Paket kamu sedang dikirim. Tracking: ${event.courierName}`,
      });
    }
  });
  
  // Log all events to audit trail
  eventBus.on('*', async (event: CommerceEvent) => {
    await db.insert(eventAuditLog).values({
      eventType: event.type,
      payload: JSON.stringify(event),
      timestamp: new Date(),
    });
  });
}
```

---

## PATTERN 4: ERROR HANDLING

### Location in OpenClaw
- **File**: `src/infra/errors.ts` (error utilities)
- **Related**: `src/infra/retry-policy.ts` (error-based retry decisions)

### How It Works

OpenClaw uses **structured error handling** with type guards and specific error codes.

```typescript
// src/infra/errors.ts (actual OpenClaw code)
export function extractErrorCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object") {
    return undefined;
  }
  const code = (err as { code?: unknown }).code;
  if (typeof code === "string") {
    return code;
  }
  if (typeof code === "number") {
    return String(code);
  }
  return undefined;
}

export function isErrno(err: unknown): err is NodeJS.ErrnoException {
  return Boolean(err && typeof err === "object" && "code" in err);
}

export function hasErrnoCode(err: unknown, code: string): boolean {
  return isErrno(err) && err.code === code;
}

export function formatErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message || err.name || "Error";
  }
  if (typeof err === "string") {
    return err;
  }
  // ... handle other cases
  return JSON.stringify(err);
}

// Usage in retry-policy.ts
const TELEGRAM_RETRY_RE = /429|timeout|connect|reset|closed|unavailable|temporarily/i;

function shouldRetryTelegram(err: unknown): boolean {
  return TELEGRAM_RETRY_RE.test(formatErrorMessage(err));
}
```

### Key Insights

1. **Type Guards**: Helper functions to safely check error properties
2. **Error Codes**: Distinguish errors by code (not just message)
3. **Safe Extraction**: Never crashes when extracting error info
4. **Format Agnostic**: Handle strings, Error objects, unknown objects
5. **Retry Decisions**: Use error info to decide if retry is appropriate

### How I'll Implement It for Commerce

```typescript
// src/errors/types.ts
export enum ErrorCode {
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INVALID_CURRENCY = 'INVALID_CURRENCY',
  
  // Customer errors
  CUSTOMER_NOT_FOUND = 'CUSTOMER_NOT_FOUND',
  CUSTOMER_INACTIVE = 'CUSTOMER_INACTIVE',
  
  // Order errors
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  ORDER_ALREADY_PAID = 'ORDER_ALREADY_PAID',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  
  // Payment errors
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_GATEWAY_ERROR = 'PAYMENT_GATEWAY_ERROR',
  PAYMENT_TIMEOUT = 'PAYMENT_TIMEOUT',
  PAYMENT_RATE_LIMIT = 'PAYMENT_RATE_LIMIT',
  
  // Inventory errors
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  INVENTORY_LOCKED = 'INVENTORY_LOCKED',
  
  // Gateway errors (retryable)
  GATEWAY_UNAVAILABLE = 'GATEWAY_UNAVAILABLE',
  GATEWAY_TIMEOUT = 'GATEWAY_TIMEOUT',
  GATEWAY_CONNECTION_ERROR = 'GATEWAY_CONNECTION_ERROR',
  
  // System errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export class CommerceError extends Error {
  public readonly code: ErrorCode;
  public readonly status: number;
  public readonly retryable: boolean;
  public readonly context?: Record<string, any>;
  
  constructor(
    message: string,
    code: ErrorCode,
    status: number = 400,
    retryable: boolean = false,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'CommerceError';
    this.code = code;
    this.status = status;
    this.retryable = retryable;
    this.context = context;
  }
}

export class PaymentError extends CommerceError {
  constructor(
    message: string,
    code: ErrorCode,
    context?: Record<string, any>,
    retryable: boolean = false
  ) {
    super(message, code, 402, retryable, context);
    this.name = 'PaymentError';
  }
}

export class ValidationError extends CommerceError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, false, context);
    this.name = 'ValidationError';
  }
}

// src/errors/handling.ts
export function extractErrorCode(err: unknown): ErrorCode | string | undefined {
  if (err instanceof CommerceError) {
    return err.code;
  }
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code?: unknown }).code;
    if (typeof code === 'string') return code;
  }
  return undefined;
}

export function isRetryable(err: unknown): boolean {
  if (err instanceof CommerceError) {
    return err.retryable;
  }
  
  const code = extractErrorCode(err);
  const retryableCodes = [
    ErrorCode.PAYMENT_GATEWAY_ERROR,
    ErrorCode.PAYMENT_TIMEOUT,
    ErrorCode.PAYMENT_RATE_LIMIT,
    ErrorCode.GATEWAY_UNAVAILABLE,
    ErrorCode.GATEWAY_TIMEOUT,
    ErrorCode.GATEWAY_CONNECTION_ERROR,
  ];
  
  return retryableCodes.includes(code as ErrorCode);
}

export function toErrorResponse(err: unknown) {
  if (err instanceof CommerceError) {
    return {
      error: {
        code: err.code,
        message: err.message,
        status: err.status,
      },
    };
  }
  
  if (err instanceof Error) {
    return {
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: err.message,
        status: 500,
      },
    };
  }
  
  return {
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Unknown error',
      status: 500,
    },
  };
}

// Usage in payment processing
export async function processPayment(
  orderId: string,
  amount: Amount,
  gateway: PaymentGateway
): Promise<PaymentResult> {
  try {
    const result = await gateway.charge({ orderId, ...amount });
    return result;
  } catch (err) {
    if (isRetryable(err)) {
      throw new PaymentError(
        `Payment failed: ${formatErrorMessage(err)}`,
        ErrorCode.PAYMENT_GATEWAY_ERROR,
        { orderId, gateway: gateway.id, originalError: err },
        true // retryable
      );
    }
    
    throw new PaymentError(
      formatErrorMessage(err),
      ErrorCode.PAYMENT_FAILED,
      { orderId, gateway: gateway.id },
      false
    );
  }
}
```

---

## PATTERN 5: RETRY LOGIC

### Location in OpenClaw
- **File**: `src/infra/retry.ts` (core retry implementation)
- **File**: `src/infra/retry-policy.ts` (channel-specific retry policies)

### How It Works

OpenClaw implements **sophisticated retry logic** with exponential backoff, jitter, and channel-specific policies.

```typescript
// src/infra/retry.ts (actual code, slightly simplified)
export type RetryConfig = {
  attempts?: number;          // Default: 3
  minDelayMs?: number;        // Default: 300ms
  maxDelayMs?: number;        // Default: 30s
  jitter?: number;            // Default: 0 (range 0-1)
};

export type RetryOptions = RetryConfig & {
  label?: string;
  shouldRetry?: (err: unknown, attempt: number) => boolean;
  retryAfterMs?: (err: unknown) => number | undefined;
  onRetry?: (info: RetryInfo) => void;
};

export async function retryAsync<T>(
  fn: () => Promise<T>,
  attemptsOrOptions: number | RetryOptions = 3,
  initialDelayMs = 300,
): Promise<T> {
  const resolved = resolveRetryConfig(DEFAULT_RETRY_CONFIG, options);
  const maxAttempts = resolved.attempts;
  let lastErr: unknown;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt >= maxAttempts || !shouldRetry(err, attempt)) {
        break;
      }
      
      // Exponential backoff: 300ms, 600ms, 1200ms, ...
      const baseDelay = minDelayMs * 2 ** (attempt - 1);
      
      // Add jitter to prevent thundering herd
      let delay = Math.min(baseDelay, maxDelayMs);
      delay = applyJitter(delay, jitter);
      
      // Notify listeners before retry
      options.onRetry?.({
        attempt,
        maxAttempts,
        delayMs: delay,
        err,
        label: options.label,
      });
      
      await sleep(delay);
    }
  }
  
  throw lastErr ?? new Error("Retry failed");
}

// src/infra/retry-policy.ts (channel-specific policies)
export const TELEGRAM_RETRY_DEFAULTS = {
  attempts: 3,
  minDelayMs: 400,
  maxDelayMs: 30_000,
  jitter: 0.1,
};

export const DISCORD_RETRY_DEFAULTS = {
  attempts: 3,
  minDelayMs: 500,
  maxDelayMs: 30_000,
  jitter: 0.1,
};

export function createTelegramRetryRunner(params: {
  retry?: RetryConfig;
  verbose?: boolean;
}): RetryRunner {
  const retryConfig = resolveRetryConfig(TELEGRAM_RETRY_DEFAULTS, params.retry);
  
  return <T>(fn: () => Promise<T>, label?: string) =>
    retryAsync(fn, {
      ...retryConfig,
      label,
      shouldRetry: (err) => {
        // Only retry on network/timeout errors, not business logic errors
        const TELEGRAM_RETRY_RE = /429|timeout|connect|reset|closed|unavailable/i;
        return TELEGRAM_RETRY_RE.test(formatErrorMessage(err));
      },
      retryAfterMs: getTelegramRetryAfterMs, // Read Retry-After header
      onRetry: params.verbose ? (info) => {
        console.warn(
          `telegram send retry ${info.attempt}/${info.maxAttempts} in ${info.delayMs}ms`
        );
      } : undefined,
    });
}
```

### Key Insights

1. **Exponential Backoff**: Delay doubles each attempt (300ms, 600ms, 1.2s)
2. **Jitter**: Random variation prevents thundering herd problem
3. **Max Delay**: Prevents indefinite waits
4. **Retryable Decision**: Custom logic per error type
5. **Retry-After Header**: Respects server's suggested retry time
6. **Observability**: `onRetry` callback for logging/monitoring
7. **Channel-Specific**: Different retry policies for Telegram vs Discord

### How I'll Implement It for Commerce

```typescript
// src/payments/retry-config.ts
export const PAYMENT_RETRY_DEFAULTS = {
  attempts: 5,                 // More attempts for payments
  minDelayMs: 1000,           // Wait longer than messages
  maxDelayMs: 60_000,         // Max 60 seconds
  jitter: 0.2,                // More variance to spread load
};

export const XENDIT_RETRY_CONFIG = {
  attempts: 4,
  minDelayMs: 1200,
  maxDelayMs: 45_000,
  jitter: 0.15,
};

export const STRIPE_RETRY_CONFIG = {
  attempts: 3,
  minDelayMs: 500,
  maxDelayMs: 30_000,
  jitter: 0.1,
};

// src/payments/payment-service.ts
export class PaymentService {
  constructor(
    private db: Database,
    private eventBus: EventBus,
    private gateways: Map<string, PaymentGateway>
  ) {}
  
  async processPaymentWithRetry(
    orderId: string,
    amount: Amount,
    gatewayId: string,
    verbose: boolean = false
  ): Promise<PaymentResult> {
    const gateway = this.gateways.get(gatewayId);
    if (!gateway) {
      throw new ValidationError('Invalid gateway', { gatewayId });
    }
    
    // Select retry config based on gateway
    const retryConfig = gatewayId === 'stripe'
      ? STRIPE_RETRY_CONFIG
      : gatewayId === 'xendit'
        ? XENDIT_RETRY_CONFIG
        : PAYMENT_RETRY_DEFAULTS;
    
    return await retryAsync(
      async () => {
        // Attempt payment
        return await gateway.charge({
          orderId,
          amount: amount.amount,
          currency: amount.currency,
        });
      },
      {
        ...retryConfig,
        label: `payment/${gatewayId}/${orderId}`,
        
        // Only retry on transient errors, not business logic errors
        shouldRetry: (err) => {
          if (err instanceof CommerceError) {
            return err.retryable;
          }
          
          const code = extractErrorCode(err);
          const nonRetryable = [
            ErrorCode.INVALID_AMOUNT,
            ErrorCode.CUSTOMER_INACTIVE,
            ErrorCode.ORDER_ALREADY_PAID,
            ErrorCode.INSUFFICIENT_BALANCE,
          ];
          
          if (nonRetryable.includes(code as ErrorCode)) {
            return false;
          }
          
          // Default: retry on unknown errors
          return true;
        },
        
        // Extract server-provided retry time
        retryAfterMs: (err) => {
          if (err && typeof err === 'object' && 'retryAfter' in err) {
            const retryAfter = (err as { retryAfter?: unknown }).retryAfter;
            if (typeof retryAfter === 'number') {
              return retryAfter * 1000; // Convert to ms
            }
          }
          return undefined;
        },
        
        // Log retry attempts
        onRetry: (info) => {
          if (verbose) {
            console.warn(
              `Payment retry ${info.attempt}/${info.maxAttempts} ` +
              `for order ${orderId} in ${info.delayMs}ms: ${formatErrorMessage(info.err)}`
            );
          }
          
          // Emit event for observability
          this.eventBus.emit({
            type: 'payment:retry_attempted',
            orderId,
            attempt: info.attempt,
            maxAttempts: info.maxAttempts,
            delayMs: info.delayMs,
            error: formatErrorMessage(info.err),
          });
        },
      }
    );
  }
}
```

---

## ARCHITECTURE INSIGHTS

### How Patterns Work Together

```
OpenClaw Architecture:
┌─────────────────────────────────────────┐
│ Plugin Registry                         │
│ (Channels, tools, hooks, providers)     │
└────────────────┬────────────────────────┘
                 │
        ┌────────▼────────┐
        │ Dependency      │
        │ Injection       │
        │ (Create services│
        │ with deps)      │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │ Event-Driven    │
        │ System          │
        │ (Emit/listen)   │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │ Error Handling  │
        │ (Type guards,   │
        │ error codes)    │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │ Retry Logic     │
        │ (Exponential    │
        │ backoff)        │
        └─────────────────┘
```

### Why These Patterns Matter

1. **Plugin Registry**: Extensibility without modifying core
2. **Dependency Injection**: Testability and loose coupling
3. **Event-Driven**: Scalability and clean separation
4. **Error Handling**: Reliability and observability
5. **Retry Logic**: Resilience to transient failures

### Integration for Commerce

```
Unified-Agentic-OS Architecture:
┌────────────────────────────────────────────────────────┐
│                   Plugin Registry                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │ Channels │  │ Gateways │  │ Workflow Plugins     │ │
│  │(WhatsApp)│  │(Stripe)  │  │(Order processing)    │ │
│  └──────────┘  └──────────┘  └──────────────────────┘ │
└─────────────────────┬──────────────────────────────────┘
                      │
          ┌───────────▼────────────┐
          │ Dependency Injection   │
          │ ┌────────────────────┐ │
          │ │ Services:          │ │
          │ │ - Payment          │ │
          │ │ - Order            │ │
          │ │ - Customer         │ │
          │ │ - Inventory        │ │
          │ │ - Workflow Engine  │ │
          │ └────────────────────┘ │
          └───────────┬────────────┘
                      │
          ┌───────────▼────────────┐
          │ Event Bus              │
          │ ┌────────────────────┐ │
          │ │ Order events       │ │
          │ │ Payment events     │ │
          │ │ Inventory events   │ │
          │ │ Customer events    │ │
          │ └────────────────────┘ │
          └───────────┬────────────┘
                      │
          ┌───────────▼────────────┐
          │ Event Handlers         │
          │ ┌────────────────────┐ │
          │ │ payment:confirmed  │ │
          │ │  → pack order      │ │
          │ │ inventory:reserved │ │
          │ │  → update order    │ │
          │ │ order:shipped      │ │
          │ │  → notify customer │ │
          │ └────────────────────┘ │
          └───────────┬────────────┘
                      │
          ┌───────────▼────────────┐
          │ Error Handling         │
          │ (Structured errors,    │
          │ error codes, context)  │
          └───────────┬────────────┘
                      │
          ┌───────────▼────────────┐
          │ Retry Logic            │
          │ (Payment retries with   │
          │ exponential backoff)    │
          └────────────────────────┘
```

---

## IMPLEMENTATION STRATEGY

### Phase 1: Foundation (Week 1-2)
- [ ] Set up project structure
- [ ] Implement plugin registry (channels, gateways, workflows)
- [ ] Set up dependency injection
- [ ] Create event bus with commerce events
- [ ] Add error handling with commerce-specific errors
- [ ] Add retry logic for payments

### Phase 2: Core Services (Week 3-4)
- [ ] Payment service (with retry)
- [ ] Order service (with events)
- [ ] Customer service (with history)
- [ ] Inventory service (with reservations)
- [ ] Workflow engine (state machines)

### Phase 3: Integration (Week 5-6)
- [ ] Connect services via event bus
- [ ] Add WhatsApp and Telegram channels
- [ ] Add Xendit and QRIS payment gateways
- [ ] Implement order workflows
- [ ] Add customer context to AI agent

### Phase 4: Compliance & Scaling (Week 7-8)
- [ ] Add error handling throughout
- [ ] Add comprehensive logging/audit trail
- [ ] Add test coverage
- [ ] Performance optimization
- [ ] Deploy

---

## KEY TAKEAWAYS

1. **Patterns Not Code**: Don't copy-paste OpenClaw code; understand and adapt patterns
2. **Type Safety**: Use TypeScript strictly; catch errors at compile time
3. **Event-Driven First**: Make system event-driven from the start
4. **Explicit Dependencies**: Use DI; never global state
5. **Commerce-Specific**: Adapt patterns for payment domain (retries, error handling)
6. **Testability**: Design for testing; mock dependencies easily
7. **Observability**: Log events, errors, retries for debugging
8. **Extensibility**: Use plugin registry; make it easy to add gateways, channels

---

**Next Steps**:
- Start Day 8-9: Design ARCHITECTURE.md (full system design)
- Create detailed database schema (Day 10)
- Document API endpoints (Day 11)
- Finalize and commit (Day 12-14)

**Files to Create Next**:
1. `ARCHITECTURE.md` - System design document
2. `DATABASE-SCHEMA.md` - Drizzle ORM schema planning
3. `API-ENDPOINTS.md` - REST API documentation
4. Project repo initialization

---

**Document Author**: AI Research Agent  
**Date**: February 10, 2026  
**Status**: Day 5-7 research complete; ready for architecture design phase
