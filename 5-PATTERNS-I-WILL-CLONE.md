# 5-Patterns-I-Will-Clone.md

## Comprehensive Guide to OpenClaw Patterns for Unified-Agentic-OS

**Date**: February 10, 2026  
**Status**: Day 3-4 Deep Dive  
**Purpose**: Detailed understanding of 5 architectural patterns from OpenClaw  

---

## PATTERN 1: Plugin Registry Pattern

### What & Why

**What**: Dynamic registration and retrieval system for plugins/modules without modifying core code

**Why It Matters**:
- ✅ Extensibility: New channels/services added without core changes
- ✅ Modularity: Each plugin is independent
- ✅ Runtime Loading: Enable/disable plugins at runtime
- ✅ Clean Separation: Core doesn't know about specific plugins

### How OpenClaw Uses It

**Location**: `src/channels/registry.ts`

**Purpose**: Register channels (Telegram, Discord, WhatsApp, etc) dynamically

```typescript
// OpenClaw approach
class ChannelRegistry {
  private channels = new Map<string, Channel>();
  
  register(name: string, channel: Channel) {
    this.channels.set(name, channel);
  }
  
  get(name: string) {
    return this.channels.get(name);
  }
  
  getAll() {
    return new Map(this.channels);
  }
}

// Load channels at startup
const registry = new ChannelRegistry();
registry.register('telegram', new TelegramChannel(deps));
registry.register('discord', new DiscordChannel(deps));
registry.register('whatsapp', new WhatsAppChannel(deps));
```

### How I'll Implement It

**Location**: `src/architecture/patterns/plugin-registry.ts`

**For My Project**: Multiple registries for different plugin types

```typescript
// Generic registry interface
export interface Registry<T> {
  register(name: string, item: T): void;
  get(name: string): T;
  has(name: string): boolean;
  getAll(): Map<string, T>;
  unregister(name: string): void;
}

// Channel Registry
export interface Channel {
  name: string;
  type: 'telegram' | 'whatsapp' | 'discord' | 'signal';
  sendMessage(to: string, message: string): Promise<void>;
  receiveMessage(handler: MessageHandler): void;
  getStatus(): Promise<ChannelStatus>;
}

export class ChannelRegistry implements Registry<Channel> {
  private channels = new Map<string, Channel>();
  
  register(name: string, channel: Channel): void {
    if (this.channels.has(name)) {
      throw new Error(`Channel ${name} already registered`);
    }
    this.channels.set(name, channel);
    logger.info(`Channel registered: ${name}`);
  }
  
  get(name: string): Channel {
    const channel = this.channels.get(name);
    if (!channel) {
      throw new Error(`Channel ${name} not found`);
    }
    return channel;
  }
  
  has(name: string): boolean {
    return this.channels.has(name);
  }
  
  getAll(): Map<string, Channel> {
    return new Map(this.channels);
  }
  
  unregister(name: string): void {
    if (!this.channels.has(name)) {
      throw new Error(`Channel ${name} not found`);
    }
    this.channels.delete(name);
    logger.info(`Channel unregistered: ${name}`);
  }
}

// Payment Gateway Registry
export interface PaymentGateway {
  name: string;
  provider: 'stripe' | 'xendit' | 'qris' | 'custom';
  process(payment: Payment): Promise<TransactionResult>;
  reconcile(transaction: Transaction): Promise<ReconciliationResult>;
}

export class PaymentGatewayRegistry implements Registry<PaymentGateway> {
  private gateways = new Map<string, PaymentGateway>();
  
  register(name: string, gateway: PaymentGateway): void {
    this.gateways.set(name, gateway);
    logger.info(`Payment gateway registered: ${name}`);
  }
  
  get(name: string): PaymentGateway {
    const gateway = this.gateways.get(name);
    if (!gateway) {
      throw new Error(`Gateway ${name} not found`);
    }
    return gateway;
  }
  
  getAll(): Map<string, PaymentGateway> {
    return new Map(this.gateways);
  }
  
  // Custom: Get all gateways for specific provider
  getByProvider(provider: string): PaymentGateway[] {
    return Array.from(this.gateways.values()).filter(
      g => g.provider === provider
    );
  }
}

// Agent Registry
export interface Agent {
  name: string;
  type: 'commerce' | 'support' | 'analytics' | 'custom';
  process(input: AgentInput): Promise<AgentOutput>;
}

export class AgentRegistry implements Registry<Agent> {
  private agents = new Map<string, Agent>();
  
  register(name: string, agent: Agent): void {
    this.agents.set(name, agent);
    logger.info(`Agent registered: ${name}`);
  }
  
  get(name: string): Agent {
    const agent = this.agents.get(name);
    if (!agent) {
      throw new Error(`Agent ${name} not found`);
    }
    return agent;
  }
  
  getAll(): Map<string, Agent> {
    return new Map(this.agents);
  }
}
```

### Usage Example

```typescript
// Initialize registries
const deps = createDefaultDeps(config);
const channelRegistry = new ChannelRegistry();
const gatewayRegistry = new PaymentGatewayRegistry();
const agentRegistry = new AgentRegistry();

// Register channels
channelRegistry.register('telegram', new TelegramChannel(deps));
channelRegistry.register('whatsapp', new WhatsAppChannel(deps));
channelRegistry.register('discord', new DiscordChannel(deps));

// Register payment gateways
gatewayRegistry.register('stripe', new StripeGateway(deps));
gatewayRegistry.register('xendit', new XenditGateway(deps));
gatewayRegistry.register('qris', new QRISGateway(deps));

// Register agents
agentRegistry.register('commerce', new CommerceAgent(deps));
agentRegistry.register('support', new SupportAgent(deps));

// Use in application
async function routeMessage(message: IncomingMessage) {
  const channel = channelRegistry.get(message.channelType);
  const agent = agentRegistry.get('commerce');
  
  const response = await agent.process({
    message: message.text,
    channelId: message.channelId,
    userId: message.userId
  });
  
  await channel.sendMessage(message.userId, response);
}
```

### Key Benefits

✅ **Loose Coupling**: Core doesn't know about specific implementations  
✅ **Easy Testing**: Mock registries in tests  
✅ **Dynamic Loading**: Add/remove plugins at runtime  
✅ **Clear Interface**: All plugins implement same interface  
✅ **Error Handling**: Clear "not found" errors  

---

## PATTERN 2: Dependency Injection

### What & Why

**What**: Pass all dependencies as parameters instead of importing them globally

**Why It Matters**:
- ✅ Testability: Easy to mock/stub dependencies
- ✅ Flexibility: Swap implementations without code changes
- ✅ Configuration: Centralized in one place
- ✅ Clarity: Explicit about what each service needs

### How OpenClaw Uses It

**Location**: `src/infra/deps.ts`

```typescript
// OpenClaw approach
export interface Dependencies {
  db: Database;
  logger: Logger;
  config: Config;
  httpClient: HttpClient;
  // ... other dependencies
}

export function createDefaultDeps(config: Config): Dependencies {
  const logger = new Logger(config.logLevel);
  const db = new Database(config.database);
  const httpClient = new HttpClient(config.timeout);
  
  return { db, logger, config, httpClient };
}

// Usage: Pass deps to service
export class TelegramChannel {
  constructor(private deps: Dependencies) {}
  
  async sendMessage(to: string, text: string) {
    this.deps.logger.info('Sending message', { to, text });
    return await this.deps.httpClient.post('https://api.telegram.org/...', {
      chat_id: to,
      text: text
    });
  }
}
```

### How I'll Implement It

**Location**: `src/architecture/patterns/dependency-injection.ts`

```typescript
// Unified dependencies for my project
export interface UnifiedDependencies {
  // Infrastructure
  db: Database;
  logger: Logger;
  config: Config;
  httpClient: HttpClient;
  encryption: EncryptionService;
  
  // Registries
  channelRegistry: ChannelRegistry;
  paymentGatewayRegistry: PaymentGatewayRegistry;
  agentRegistry: AgentRegistry;
  
  // Services
  orderService: OrderService;
  paymentService: PaymentService;
  inventoryService: InventoryService;
  customerService: CustomerService;
  
  // Events & Workflows
  eventEmitter: CommerceEventEmitter;
  workflowEngine: WorkflowEngine;
  
  // AI & Agents
  aiProvider: AIProvider;
  agentFactory: AgentFactory;
  
  // Observability
  auditLog: AuditLogger;
  metricsCollector: MetricsCollector;
}

export function createDefaultDeps(config: Config): UnifiedDependencies {
  // Infrastructure
  const logger = new Logger(config.logLevel);
  const db = new Database(config.database);
  const httpClient = new HttpClient(config.httpTimeout);
  const encryption = new EncryptionService(config.encryptionKey);
  
  // Registries
  const channelRegistry = new ChannelRegistry();
  const paymentGatewayRegistry = new PaymentGatewayRegistry();
  const agentRegistry = new AgentRegistry();
  
  // Events
  const eventEmitter = new CommerceEventEmitter();
  
  // Services (depend on db, logger, etc)
  const customerService = new CustomerService(db, logger);
  const inventoryService = new InventoryService(db, logger, eventEmitter);
  const orderService = new OrderService(db, logger, inventoryService, eventEmitter);
  const paymentService = new PaymentService(
    db,
    logger,
    paymentGatewayRegistry,
    encryption,
    eventEmitter
  );
  
  // Workflows
  const workflowEngine = new WorkflowEngine(db, logger, eventEmitter);
  
  // AI
  const aiProvider = new VercelAIProvider(config.aiApiKey);
  const agentFactory = new AgentFactory(aiProvider, config.aiModels);
  
  // Observability
  const auditLog = new AuditLogger(db, logger);
  const metricsCollector = new MetricsCollector(logger);
  
  return {
    // Infrastructure
    db, logger, config, httpClient, encryption,
    
    // Registries
    channelRegistry, paymentGatewayRegistry, agentRegistry,
    
    // Services
    orderService, paymentService, inventoryService, customerService,
    
    // Events & Workflows
    eventEmitter, workflowEngine,
    
    // AI & Agents
    aiProvider, agentFactory,
    
    // Observability
    auditLog, metricsCollector
  };
}

// Export wrapper untuk convenience
export function createDeps(configPath: string): UnifiedDependencies {
  const config = loadConfig(configPath);
  return createDefaultDeps(config);
}
```

### Usage Example

```typescript
// Initialize with deps
const deps = createDefaultDeps(config);

// Pass to services
const orderService = new OrderService(deps);
const paymentService = new PaymentService(deps);

// Services can access all dependencies
export class OrderService {
  constructor(private deps: UnifiedDependencies) {}
  
  async createOrder(customerId: string, items: OrderItem[]): Promise<Order> {
    this.deps.logger.info('Creating order', { customerId, itemCount: items.length });
    
    // Check inventory
    for (const item of items) {
      const stock = await this.deps.inventoryService.checkStock(item.productId);
      if (stock < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.productId}`);
      }
    }
    
    // Create order in database
    const order = await this.deps.db.orders.create({
      customerId,
      items,
      status: 'pending',
      createdAt: new Date()
    });
    
    // Log audit
    this.deps.auditLog.log('order:created', { orderId: order.id, customerId });
    
    // Emit event (so other services can listen)
    await this.deps.eventEmitter.emit({
      type: 'order:created',
      orderId: order.id,
      customerId
    });
    
    return order;
  }
}

// Testing is easy - mock deps
const mockDeps = {
  db: mockDatabase,
  logger: mockLogger,
  inventoryService: mockInventoryService,
  // ... other mocks
};

const orderService = new OrderService(mockDeps);
const order = await orderService.createOrder('cust_123', [{...}]);
expect(mockDatabase.orders.create).toHaveBeenCalled();
```

### Key Benefits

✅ **Testability**: Easy to mock in unit tests  
✅ **Flexibility**: Change implementations without changing code  
✅ **Configuration**: One place to configure all dependencies  
✅ **Clarity**: See exactly what each service depends on  
✅ **Maintainability**: Changes to deps don't cascade through code  

---

## PATTERN 3: Event-Driven Architecture

### What & Why

**What**: Components emit events, other components listen and react

**Why It Matters**:
- ✅ Decoupling: Components don't need to know about each other
- ✅ Scalability: Easy to add new listeners without changing emitter
- ✅ Parallelism: Multiple handlers can process same event
- ✅ Order Management: Complex workflows via event chains

### How OpenClaw Uses It

**Location**: `src/gateway/gateway.ts`

```typescript
// OpenClaw approach
class MessageGateway {
  private eventEmitter = new EventEmitter();
  
  async handleIncomingMessage(message: Message) {
    // Emit event
    await this.eventEmitter.emit('message:received', message);
  }
}

// Plugins listen to events
class LoggingPlugin {
  constructor(gateway: MessageGateway) {
    gateway.on('message:received', (message) => {
      logger.info(`Message from ${message.from}: ${message.text}`);
    });
  }
}

class AIPlugin {
  constructor(gateway: MessageGateway) {
    gateway.on('message:received', async (message) => {
      const response = await ai.generate(message.text);
      gateway.emit('response:ready', { response });
    });
  }
}
```

### How I'll Implement It

**Location**: `src/architecture/patterns/event-emitter.ts`

```typescript
// Define commerce-specific events with TypeScript
export type CommerceEvent = 
  // Order events
  | { type: 'order:created'; orderId: string; customerId: string; total: number }
  | { type: 'order:pending_payment'; orderId: string; transactionId: string }
  | { type: 'order:paid'; orderId: string; transactionId: string; amount: number }
  | { type: 'order:payment_failed'; orderId: string; error: string }
  | { type: 'order:packed'; orderId: string; trackingId: string }
  | { type: 'order:shipped'; orderId: string; trackingId: string }
  | { type: 'order:delivered'; orderId: string }
  | { type: 'order:completed'; orderId: string; rating?: number }
  | { type: 'order:cancelled'; orderId: string; reason: string }
  
  // Payment events
  | { type: 'payment:received'; transactionId: string; amount: number; gateway: string }
  | { type: 'payment:failed'; transactionId: string; error: string; attempts: number }
  | { type: 'payment:refunded'; transactionId: string; amount: number }
  
  // Inventory events
  | { type: 'inventory:low'; productId: string; remaining: number; threshold: number }
  | { type: 'inventory:updated'; productId: string; newStock: number; oldStock: number }
  
  // Customer events
  | { type: 'customer:created'; customerId: string; source: string }
  | { type: 'customer:updated'; customerId: string; changes: Record<string, any> }
  
  // Message events
  | { type: 'message:incoming'; customerId: string; text: string; channel: string }
  | { type: 'message:outgoing'; customerId: string; text: string; channel: string }
  
  // Agent events
  | { type: 'agent:invoked'; agentName: string; input: string }
  | { type: 'agent:completed'; agentName: string; output: string };

// Type-safe event emitter
export class CommerceEventEmitter {
  private handlers = new Map<string, ((data: any) => Promise<void>)[]>();
  
  on<T extends CommerceEvent['type']>(
    eventType: T,
    handler: (event: Extract<CommerceEvent, { type: T }>) => Promise<void>
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler as any);
  }
  
  async emit(event: CommerceEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    
    // Run all handlers in parallel
    await Promise.all(
      handlers.map(handler => 
        handler(event).catch(error => {
          logger.error(`Error in event handler for ${event.type}`, { error });
        })
      )
    );
  }
  
  // Debugging: list all subscribed handlers
  getSubscriptions(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [event, handlers] of this.handlers.entries()) {
      result[event] = handlers.length;
    }
    return result;
  }
}
```

### Usage Example

```typescript
// Create event emitter
const emitter = new CommerceEventEmitter();

// Subscribe to order events
emitter.on('order:paid', async (event) => {
  // Trigger fulfillment workflow
  await workflowEngine.start('order-fulfillment', {
    orderId: event.orderId,
    amount: event.amount
  });
});

// Subscribe to inventory events
emitter.on('inventory:low', async (event) => {
  // Send alert to owner
  await notificationService.sendToOwner({
    type: 'low_inventory',
    productId: event.productId,
    remaining: event.remaining
  });
});

// Subscribe to payment events
emitter.on('payment:failed', async (event) => {
  // Notify customer & ask to retry
  const order = await orderService.findByPayment(event.transactionId);
  if (event.attempts < 3) {
    await channelRegistry.get('whatsapp').sendMessage(
      order.customerId,
      `Payment gagal, coba lagi atau gunakan metode pembayaran lain`
    );
  }
});

// Emit event when order is created
async function createOrder(customerId: string, items: OrderItem[]) {
  const order = await orderService.create(customerId, items);
  
  // Emit event - all listeners will be notified
  await emitter.emit({
    type: 'order:created',
    orderId: order.id,
    customerId,
    total: order.total
  });
  
  return order;
}

// Emit event when payment received
async function handlePaymentWebhook(webhook: PaymentWebhook) {
  const transaction = await db.transactions.update(webhook.txnId, {
    status: 'paid'
  });
  
  // Emit event
  await emitter.emit({
    type: 'payment:received',
    transactionId: webhook.txnId,
    amount: webhook.amount,
    gateway: webhook.gateway
  });
}
```

### Key Benefits

✅ **Decoupling**: Services don't call each other directly  
✅ **Scalability**: Add new listeners without changing emitter  
✅ **Testability**: Easy to test by emitting events and checking results  
✅ **Parallelism**: Multiple handlers run simultaneously  
✅ **Auditability**: Event log shows all state changes  

---

## PATTERN 4: Error Handling with Context

### What & Why

**What**: Structured error objects with error codes, HTTP status, and context

**Why It Matters**:
- ✅ Consistency: All errors follow same structure
- ✅ Debugging: Context helps trace problem
- ✅ Frontend: Clear error codes for UI handling
- ✅ Logging: Structured logs for analysis

### How OpenClaw Uses It

```typescript
// OpenClaw approach
export class ApplicationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}

export function handleError(error: unknown, context: string, logger: Logger) {
  if (error instanceof ApplicationError) {
    logger.error(`[${context}] ${error.message}`, {
      code: error.code,
      context: error.context
    });
    return {
      statusCode: error.statusCode,
      error: error.code,
      message: error.message
    };
  }
  
  logger.error(`[${context}] Unexpected error`, { error });
  return {
    statusCode: 500,
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred'
  };
}
```

### How I'll Implement It

**Location**: `src/architecture/patterns/error-handler.ts`

```typescript
// Base error class
export class ApplicationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}

// Domain-specific errors
export class ValidationError extends ApplicationError {
  constructor(message: string, context?: any) {
    super(message, 'VALIDATION_ERROR', 400, context);
  }
}

export class PaymentError extends ApplicationError {
  constructor(message: string, context?: any) {
    super(message, 'PAYMENT_ERROR', 402, context);
  }
}

export class GatewayError extends PaymentError {
  constructor(gateway: string, message: string, context?: any) {
    super(
      `Payment gateway error (${gateway}): ${message}`,
      { gateway, ...context }
    );
    this.code = 'GATEWAY_ERROR';
  }
}

export class InsufficientFundsError extends PaymentError {
  constructor(orderId: string, required: number, available: number) {
    super(
      `Insufficient funds for order`,
      { orderId, required, available }
    );
    this.code = 'INSUFFICIENT_FUNDS';
  }
}

export class InventoryError extends ApplicationError {
  constructor(productId: string, requested: number, available: number) {
    super(
      `Insufficient inventory for product`,
      'INVENTORY_ERROR',
      400,
      { productId, requested, available }
    );
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(reason: string) {
    super(`Authentication failed: ${reason}`, 'AUTHENTICATION_ERROR', 401);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string, id: string) {
    super(
      `${resource} not found`,
      'NOT_FOUND',
      404,
      { resource, id }
    );
  }
}

// Error handler function
export function handleError(error: unknown, context: string, logger: Logger) {
  if (error instanceof ApplicationError) {
    // Log with context
    logger.error(`[${context}] ${error.message}`, {
      code: error.code,
      statusCode: error.statusCode,
      context: error.context,
      stack: error.stack
    });
    
    // Return API response
    return {
      statusCode: error.statusCode,
      error: {
        code: error.code,
        message: error.message,
        ...(error.context && { context: error.context })
      }
    };
  }
  
  // Unexpected error
  logger.error(`[${context}] Unexpected error`, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  });
  
  return {
    statusCode: 500,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  };
}
```

### Usage Example

```typescript
// In payment service
async function processPayment(payment: Payment): Promise<TransactionResult> {
  try {
    const gateway = paymentGatewayRegistry.get(payment.gateway);
    return await gateway.process(payment);
  } catch (error) {
    if (error instanceof PaymentError) {
      // Specific payment error - log and return
      logger.error('Payment processing failed', { error: error.code });
      throw error;
    } else if (error instanceof GatewayError) {
      // Gateway-specific error
      throw new GatewayError(payment.gateway, error.message, {
        transactionId: payment.transactionId
      });
    } else {
      // Unexpected error
      throw new ApplicationError(
        'Payment processing failed unexpectedly',
        'PAYMENT_PROCESSING_ERROR',
        500,
        { originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  }
}

// In API endpoint
app.post('/api/payments', async (req, res) => {
  try {
    const payment = validatePayment(req.body);
    const result = await paymentService.processPayment(payment);
    res.json(result);
  } catch (error) {
    const response = handleError(error, 'POST /api/payments', logger);
    res.status(response.statusCode).json(response.error);
  }
});

// Frontend can handle specific errors
// if (error.code === 'INSUFFICIENT_FUNDS') { show retry ui }
// if (error.code === 'GATEWAY_ERROR') { show choose another gateway }
// if (error.code === 'INTERNAL_ERROR') { show generic error }
```

### Key Benefits

✅ **Consistency**: All errors follow same structure  
✅ **Debugging**: Context helps trace problems  
✅ **Logging**: Structured error logs for analysis  
✅ **Frontend**: Clear error codes for UI handling  
✅ **Testing**: Easy to test error scenarios  

---

## PATTERN 5: Retry Logic with Exponential Backoff

### What & Why

**What**: Automatically retry failed operations with increasing delays

**Why It Matters**:
- ✅ Reliability: Transient failures don't cause permanent failures
- ✅ Network-Friendly: Don't hammer API when it's slow
- ✅ Cost: Fewer failed transactions = fewer manual refunds
- ✅ UX: Customer sees "retrying" instead of "failed"

### How OpenClaw Uses It

```typescript
// OpenClaw approach
export interface RetryOptions {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
  logger: Logger
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === options.maxAttempts) {
        break; // Don't retry after last attempt
      }
      
      const delay = Math.min(
        options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt - 1),
        options.maxDelayMs
      );
      
      logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms`, {
        error: lastError.message
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}
```

### How I'll Implement It

**Location**: `src/architecture/patterns/retry.ts`

```typescript
export interface RetryOptions {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  // Custom: which errors to retry on
  shouldRetry?: (error: Error) => boolean;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
  logger: Logger
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      logger.debug(`Attempt ${attempt}/${options.maxAttempts}`, {
        context: fn.name || 'anonymous'
      });
      
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Check if we should retry this error
      const shouldRetry = options.shouldRetry?.(lastError) ?? true;
      if (!shouldRetry) {
        logger.error(`Error is not retryable, failing immediately`, {
          error: lastError.message
        });
        throw lastError;
      }
      
      // Don't retry after last attempt
      if (attempt === options.maxAttempts) {
        logger.error(`All ${options.maxAttempts} attempts failed`, {
          error: lastError.message
        });
        break;
      }
      
      // Calculate exponential backoff
      const delay = Math.min(
        options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt - 1),
        options.maxDelayMs
      );
      
      logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms`, {
        error: lastError.message,
        nextAttempt: attempt + 1
      });
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Convenience function for common retry scenarios
export const RetryPresets = {
  // For API calls to external gateways
  apiCall: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2
  },
  
  // For database operations
  database: {
    maxAttempts: 5,
    initialDelayMs: 100,
    maxDelayMs: 5000,
    backoffMultiplier: 2
  },
  
  // For payment processing (longest timeout acceptable)
  payment: {
    maxAttempts: 4,
    initialDelayMs: 2000,
    maxDelayMs: 20000,
    backoffMultiplier: 2
  },
  
  // For webhook deliveries (very long retry)
  webhook: {
    maxAttempts: 10,
    initialDelayMs: 5000,
    maxDelayMs: 300000, // max 5 minutes
    backoffMultiplier: 2
  }
};

// Custom retry decorator for services
export function Retry(options: RetryOptions = RetryPresets.apiCall) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      return withRetry(
        () => originalMethod.apply(this, args),
        options,
        this.deps.logger || console
      );
    };
    
    return descriptor;
  };
}
```

### Usage Example

```typescript
// For payment processing with aggressive retry
async function processPaymentWithRetry(payment: Payment) {
  return withRetry(
    async () => {
      const gateway = paymentGatewayRegistry.get(payment.gateway);
      return await gateway.process(payment);
    },
    RetryPresets.payment,
    logger
  );
}

// For API calls with custom retry logic
async function callExternalAPI(url: string) {
  return withRetry(
    async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    },
    {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
      // Only retry on network errors, not 4xx errors
      shouldRetry: (error) => {
        return !error.message.includes('HTTP 4');
      }
    },
    logger
  );
}

// For webhook delivery (very long retry window)
async function deliverWebhook(url: string, payload: any) {
  return withRetry(
    async () => {
      await fetch(url, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    RetryPresets.webhook,
    logger
  );
}

// Timeline of retry attempts:
// Attempt 1: Try immediately
//   └─ Fail
// Attempt 2: Wait 1000ms (1 second), try
//   └─ Fail
// Attempt 3: Wait 2000ms (2 seconds), try
//   └─ Fail
// Attempt 4: Wait 4000ms (4 seconds), try
//   └─ Fail or succeed
// Total max wait: 1 + 2 + 4 = 7 seconds
```

### Key Benefits

✅ **Reliability**: Transient failures don't cause permanent failures  
✅ **Network-Friendly**: Exponential backoff prevents thundering herd  
✅ **Cost**: Fewer failed transactions = fewer manual refunds  
✅ **UX**: User sees "retrying..." instead of immediate failure  
✅ **Configurable**: Different presets for different scenarios  

---

## SUMMARY: How These 5 Patterns Work Together

```
┌─────────────────────────────────────────────────────────────┐
│  Unified-Agentic-OS System Architecture                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. PLUGIN REGISTRY (Extensibility)                        │
│     └─ Channels, Gateways, Agents all registered          │
│                                                             │
│  2. DEPENDENCY INJECTION (Testability)                     │
│     └─ All services receive same deps container           │
│                                                             │
│  3. EVENT-DRIVEN (Decoupling)                              │
│     └─ Services emit events, others listen                │
│                                                             │
│  4. ERROR HANDLING (Reliability)                           │
│     └─ Structured errors with context                     │
│                                                             │
│  5. RETRY LOGIC (Resilience)                              │
│     └─ Automatic retry with exponential backoff           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Example Flow:
1. Customer sends WhatsApp "Beli barang"
   └─ Channel receives message
   └─ Emits 'message:incoming' event (EVENT-DRIVEN)

2. Commerce Agent listens to event
   └─ Receives deps (DEPENDENCY INJECTION)
   └─ Gets payment gateway from registry (PLUGIN REGISTRY)
   └─ Processes payment with retry (RETRY LOGIC)

3. If payment fails
   └─ Structured error thrown (ERROR HANDLING)
   └─ Retry logic catches & retries with backoff

4. On success
   └─ Emits 'payment:received' event
   └─ Other listeners (fulfillment, inventory, etc) react

Result: Robust, extensible, maintainable system
```

---

**Status**: ✅ Patterns deeply understood and documented  
**Next**: Create COMPETITIVE-POSITIONING.md and commit
