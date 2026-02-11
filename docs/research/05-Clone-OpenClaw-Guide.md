# 05-Clone-OpenClaw-Guide.md

## Panduan: Clone & Adapt Arsitektur OpenClaw untuk Unified-Agentic-OS

Dokumen ini adalah practical guide untuk clone pattern & struktur dari OpenClaw tanpa copy-paste code.

---

## 📋 Persiapan

### Prerequisites
```bash
# Ensure you have these installed
node --version     # v22+
pnpm --version     # latest
git --version      # latest
postgresql --version  # 14+
```

### Create Reference Clone
```bash
# Create folder untuk reference
cd ~/Documents/projects/
git clone https://github.com/openclaw/openclaw.git openclaw-reference
cd openclaw-reference
pnpm install
```

---

## 🎯 Bagian 1: Architecture Patterns (Clone These)

### Pattern 1: Plugin Registry

**OpenClaw Location**: `src/channels/registry.ts`

**What to Clone**: 
```typescript
// Pattern: Dynamic loading & registration
interface PluginRegistry<T> {
  register(name: string, plugin: T): void;
  get(name: string): T | undefined;
  getAll(): Map<string, T>;
  unregister(name: string): void;
}

class PluginRegistryImpl<T> implements PluginRegistry<T> {
  private plugins = new Map<string, T>();
  
  register(name: string, plugin: T) {
    this.plugins.set(name, plugin);
  }
  
  get(name: string) {
    return this.plugins.get(name);
  }
  
  getAll() {
    return new Map(this.plugins);
  }
}
```

**Create in Your Project**: `src/architecture/patterns/plugin-registry.ts`

```typescript
// Your adaptation
export interface Channel {
  name: string;
  type: 'telegram' | 'whatsapp' | 'discord' | 'custom';
  // ... interface methods
}

export class ChannelRegistry {
  private channels = new Map<string, Channel>();
  
  register(name: string, channel: Channel): void {
    if (this.channels.has(name)) {
      throw new Error(`Channel ${name} already registered`);
    }
    this.channels.set(name, channel);
  }
  
  get(name: string): Channel {
    const channel = this.channels.get(name);
    if (!channel) {
      throw new Error(`Channel ${name} not found`);
    }
    return channel;
  }
}
```

---

### Pattern 2: Dependency Injection

**OpenClaw Location**: `src/infra/deps.ts`

**What to Clone**: 
```typescript
// Pattern: Central dependency container
export interface Dependencies {
  db: Database;
  logger: Logger;
  config: Config;
  // ... other dependencies
}

export function createDefaultDeps(config: Config): Dependencies {
  const logger = new Logger(config.logLevel);
  const db = new Database(config.database);
  
  return {
    db,
    logger,
    config,
    // ... initialize other deps
  };
}
```

**Create in Your Project**: `src/architecture/patterns/dependency-injection.ts`

```typescript
// Your implementation
export interface UnifiedDependencies {
  // Core
  db: Database;
  logger: Logger;
  config: Config;
  
  // Services
  channelRegistry: ChannelRegistry;
  gatewayRegistry: GatewayRegistry;
  orderService: OrderService;
  paymentService: PaymentService;
  agentFactory: AgentFactory;
  
  // Utilities
  encryption: EncryptionService;
  auditLog: AuditLogger;
}

export function createDefaultDeps(config: Config): UnifiedDependencies {
  const logger = new Logger(config.logLevel);
  const db = new Database(config.database);
  const channelRegistry = new ChannelRegistry();
  const gatewayRegistry = new GatewayRegistry();
  
  const encryption = new EncryptionService(config.encryptionKey);
  const auditLog = new AuditLogger(db, logger);
  
  const orderService = new OrderService(db, channelRegistry, gatewayRegistry);
  const paymentService = new PaymentService(db, gatewayRegistry, encryption);
  const agentFactory = new AgentFactory(config.aiModels);
  
  return {
    db, logger, config,
    channelRegistry, gatewayRegistry,
    orderService, paymentService, agentFactory,
    encryption, auditLog
  };
}

// Usage in your services
export class OrderService {
  constructor(private deps: UnifiedDependencies) {}
  
  async createOrder(dto: CreateOrderDto) {
    // Use deps
    this.deps.logger.info('Creating order');
    this.deps.auditLog.log('order:created', dto);
    // ... rest of implementation
  }
}
```

---

### Pattern 3: Event-Driven Architecture

**OpenClaw Location**: `src/gateway/gateway.ts`

**What to Clone**:
```typescript
// Pattern: Event emitter for loose coupling
export interface EventEmitter {
  on(event: string, handler: (data: any) => Promise<void>): void;
  emit(event: string, data: any): Promise<void>;
  off(event: string): void;
}
```

**Create in Your Project**: `src/architecture/patterns/event-emitter.ts`

```typescript
// Your implementation - commerce-specific events
export type CommerceEvent = 
  | { type: 'order:created'; orderId: string; customerId: string }
  | { type: 'order:paid'; orderId: string; transactionId: string }
  | { type: 'order:shipped'; orderId: string; trackingId: string }
  | { type: 'order:delivered'; orderId: string }
  | { type: 'payment:received'; transactionId: string; amount: number }
  | { type: 'payment:failed'; transactionId: string; error: string }
  | { type: 'inventory:low'; productId: string; remaining: number }
  | { type: 'customer:inquiry'; customerId: string; message: string };

export class CommerceEventEmitter {
  private handlers = new Map<string, ((data: any) => Promise<void>)[]>();
  
  on(eventType: string, handler: (data: CommerceEvent) => Promise<void>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }
  
  async emit(event: CommerceEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    await Promise.all(handlers.map(h => h(event)));
  }
}

// Usage
const emitter = new CommerceEventEmitter();

// Subscribe to events
emitter.on('order:paid', async (event) => {
  if (event.type === 'order:paid') {
    // Trigger fulfillment
  }
});

emitter.on('inventory:low', async (event) => {
  if (event.type === 'inventory:low') {
    // Send reorder alert
  }
});

// Emit events
await emitter.emit({
  type: 'order:paid',
  orderId: 'ord_123',
  transactionId: 'txn_456'
});
```

---

### Pattern 4: Error Handling

**OpenClaw Location**: `src/infra/error.ts`, `src/gateway/handlers.ts`

**What to Clone**:
```typescript
// Pattern: Structured error handling with context
export class ApplicationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public context?: Record<string, any>
  ) {
    super(message);
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

**Create in Your Project**: `src/architecture/patterns/error-handler.ts`

```typescript
// Your implementation
export class FinanceError extends ApplicationError {
  constructor(message: string, code: string, context?: any) {
    super(message, code, 400, context);
  }
}

export class PaymentProcessingError extends FinanceError {
  constructor(gatewayId: string, message: string) {
    super(
      `Payment processing failed: ${message}`,
      'PAYMENT_PROCESSING_ERROR',
      { gatewayId }
    );
  }
}

export class InsufficientFundsError extends FinanceError {
  constructor(orderId: string) {
    super(
      `Insufficient funds for order`,
      'INSUFFICIENT_FUNDS',
      { orderId }
    );
  }
}

// Usage
async function processPayment(payment: Payment, logger: Logger) {
  try {
    await gateway.process(payment);
  } catch (error) {
    const response = handleError(error, 'payment:process', logger);
    return response;
  }
}
```

---

### Pattern 5: Error Handling with Retry

**OpenClaw Pattern**: Multiple retries dengan exponential backoff

**Create in Your Project**: `src/architecture/patterns/retry.ts`

```typescript
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
      
      logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms`, { error: lastError.message });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Usage for payment processing
async function processPaymentWithRetry(payment: Payment) {
  return withRetry(
    () => gateway.process(payment),
    {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2
    },
    logger
  );
}
```

---

## 🎯 Bagian 2: File Structure (Copy & Adapt)

### Copy Configuration Files

```bash
# Copy build configuration
cp openclaw-reference/tsconfig.json ./tsconfig.json
cp openclaw-reference/tsconfig.*.json ./

# Copy linting configuration
cp openclaw-reference/oxlint.json ./oxlint.json

# Copy package.json (EDIT ini!)
cp openclaw-reference/package.json ./package.json.template
# Then manually edit untuk project Anda
```

**Edit package.json** untuk Unified-Agentic-OS:

```json
{
  "name": "unified-agentic-os",
  "version": "0.1.0",
  "description": "Unified commerce OS with messaging, payments, and AI",
  "type": "module",
  "main": "dist/index.js",
  "exports": {
    ".": "./dist/index.js",
    "./plugin-sdk": "./dist/plugin-sdk/index.js"
  },
  "scripts": {
    "build": "tsdown && pnpm build:dts",
    "build:dts": "tsc -p tsconfig.dts.json",
    "check": "pnpm format:check && pnpm tsgo && pnpm lint",
    "format": "oxfmt --write",
    "format:check": "oxfmt --check",
    "lint": "oxlint",
    "dev": "node --import tsx scripts/dev.ts",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    // Your dependencies - minimal
  },
  "devDependencies": {
    // OpenClaw dependencies anda butuh
  }
}
```

---

### Copy Scripts

```bash
# Create scripts folder
mkdir -p scripts

# Copy useful scripts
cp openclaw-reference/scripts/*.mjs ./scripts/
cp openclaw-reference/scripts/*.ts ./scripts/

# Create your own scripts
# scripts/setup-db.ts - setup database
# scripts/seed-data.ts - test data
# scripts/migrate.ts - database migrations
```

---

## 🎯 Bagian 3: Type System (Adapt)

### OpenClaw's Type Patterns

**Pattern**: TypeScript + TypeBox untuk schema validation

```bash
# Copy TypeBox configuration
pnpm add @sinclair/typebox
```

**Create in Your Project**: `src/architecture/types/base.types.ts`

```typescript
import { Type } from '@sinclair/typebox';

// Payment schema
export const PaymentSchema = Type.Object({
  id: Type.String(),
  orderId: Type.String(),
  customerId: Type.String(),
  amount: Type.Number({ minimum: 0 }),
  currency: Type.String({ minLength: 3, maxLength: 3 }),
  status: Type.Union([
    Type.Literal('pending'),
    Type.Literal('processing'),
    Type.Literal('completed'),
    Type.Literal('failed'),
    Type.Literal('refunded')
  ]),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' })
});

export type Payment = typeof PaymentSchema;

// Order schema
export const OrderSchema = Type.Object({
  id: Type.String(),
  customerId: Type.String(),
  items: Type.Array(Type.Object({
    productId: Type.String(),
    quantity: Type.Number({ minimum: 1 }),
    price: Type.Number({ minimum: 0 })
  })),
  totalAmount: Type.Number({ minimum: 0 }),
  status: Type.Union([
    Type.Literal('pending'),
    Type.Literal('paid'),
    Type.Literal('packed'),
    Type.Literal('shipped'),
    Type.Literal('delivered')
  ]),
  createdAt: Type.String({ format: 'date-time' })
});

export type Order = typeof OrderSchema;
```

---

## 🎯 Bagian 4: Channel Implementation (Adapt)

### Start with OpenClaw's Telegram Implementation

**Study**: `openclaw-reference/src/telegram/`

**Create**: `src/channels/adapters/telegram-adapter.ts`

```typescript
// Start with OpenClaw structure, adapt untuk commerce
import { Telegraf } from 'telegraf';
import { Channel } from '../base-channel';

export class TelegramChannel implements Channel {
  private bot: Telegraf;
  
  constructor(
    private token: string,
    private deps: Dependencies
  ) {
    this.bot = new Telegraf(token);
  }
  
  async sendMessage(to: string, content: string): Promise<void> {
    await this.bot.telegram.sendMessage(to, content);
  }
  
  // NEW: Commerce-specific method
  async getCustomerContext(userId: string): Promise<CustomerContext> {
    const customer = await this.deps.db.query(
      'SELECT * FROM customers WHERE telegram_id = ?',
      [userId]
    );
    return customer;
  }
  
  // NEW: Handle payment webhook
  async handlePaymentCallback(webhook: PaymentWebhook): Promise<void> {
    const order = await this.deps.orderService.getOrder(webhook.orderId);
    
    // Notify customer via Telegram
    await this.sendMessage(
      order.customerId,
      `✅ Pembayaran Anda telah diterima! Order ${webhook.orderId} confirmed.`
    );
    
    // Emit event untuk workflow
    this.deps.emitter.emit({
      type: 'order:paid',
      orderId: webhook.orderId,
      transactionId: webhook.transactionId
    });
  }
  
  async initialize(): Promise<void> {
    this.bot.start(ctx => this.handleStart(ctx));
    this.bot.command('status', ctx => this.handleStatus(ctx));
    // ... other handlers
  }
  
  private async handleStart(ctx: any) {
    const userId = ctx.from.id;
    const customer = await this.getCustomerContext(userId.toString());
    
    if (!customer) {
      ctx.reply('👋 Selamat datang! Siapa nama Anda?');
    } else {
      ctx.reply(`👋 Selamat datang kembali, ${customer.name}!`);
    }
  }
  
  private async handleStatus(ctx: any) {
    const userId = ctx.from.id;
    const customer = await this.getCustomerContext(userId.toString());
    
    if (customer && customer.lastOrderId) {
      const order = await this.deps.orderService.getOrder(customer.lastOrderId);
      ctx.reply(`📦 Order Anda status: ${order.status}`);
    }
  }
}
```

---

## 🎯 Bagian 5: Gateway Implementation (Build New)

**Don't clone from OpenClaw**, tapi follow pattern

**Create**: `src/finance/gateways/base-gateway.ts`

```typescript
export interface PaymentResult {
  success: boolean;
  transactionId: string;
  externalId: string;
  paymentUrl?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaymentGateway {
  name: string;
  
  process(payment: Payment): Promise<PaymentResult>;
  refund(transactionId: string, amount?: number): Promise<RefundResult>;
  verify(externalId: string): Promise<PaymentStatus>;
  handleWebhook(payload: any): Promise<PaymentEvent>;
}
```

**Create**: `src/finance/gateways/stripe-gateway.ts`

```typescript
import Stripe from 'stripe';

export class StripeGateway implements PaymentGateway {
  name = 'stripe';
  private stripe: Stripe;
  
  constructor(apiKey: string, private deps: Dependencies) {
    this.stripe = new Stripe(apiKey);
  }
  
  async process(payment: Payment): Promise<PaymentResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(payment.amount * 100), // Convert to cents
        currency: payment.currency.toLowerCase(),
        metadata: {
          orderId: payment.orderId,
          customerId: payment.customerId
        }
      });
      
      return {
        success: true,
        transactionId: payment.id,
        externalId: paymentIntent.id,
        paymentUrl: `https://dashboard.stripe.com/test/payments/${paymentIntent.id}`
      };
    } catch (error) {
      return {
        success: false,
        transactionId: payment.id,
        externalId: '',
        error: {
          code: 'STRIPE_ERROR',
          message: (error as Error).message
        }
      };
    }
  }
  
  async refund(transactionId: string, amount?: number): Promise<RefundResult> {
    // Implementation
  }
  
  async verify(externalId: string): Promise<PaymentStatus> {
    // Implementation
  }
  
  async handleWebhook(payload: any): Promise<PaymentEvent> {
    // Implementation
  }
}
```

---

## 🎯 Bagian 6: Testing (Follow OpenClaw Pattern)

**OpenClaw Test Pattern**:
```bash
openclaw-reference/src/
├── module.ts
├── module.test.ts  # Colocated tests
```

**Create**: `src/finance/gateways/stripe-gateway.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { StripeGateway } from './stripe-gateway';

describe('StripeGateway', () => {
  let gateway: StripeGateway;
  
  beforeEach(() => {
    // Setup mock stripe
    gateway = new StripeGateway('test_key', mockDeps);
  });
  
  it('should process payment successfully', async () => {
    const payment: Payment = {
      id: 'pay_123',
      orderId: 'ord_123',
      customerId: 'cust_123',
      amount: 100000,
      currency: 'IDR',
      status: 'pending'
    };
    
    const result = await gateway.process(payment);
    
    expect(result.success).toBe(true);
    expect(result.transactionId).toBe(payment.id);
    expect(result.externalId).toBeDefined();
  });
  
  it('should handle payment failures', async () => {
    // Test failed payment
  });
});
```

---

## 🚀 Quick Start Command

```bash
# 1. Navigate to where you want project
cd ~/Documents/projects

# 2. Clone OpenClaw for reference
git clone https://github.com/openclaw/openclaw.git openclaw-reference

# 3. Create new unified-agentic-os project
git clone https://github.com/your-org/unified-agentic-os.git
cd unified-agentic-os

# 4. Copy base configuration
cp ../openclaw-reference/tsconfig.json .
cp ../openclaw-reference/oxlint.json .
cp ../openclaw-reference/package.json package.json.original

# 5. Create folder structure
mkdir -p src/{architecture,channels,finance,commerce,agents,workflows,analytics,compliance,media,database,cli,gateway}
mkdir -p tests/{unit,integration,e2e,fixtures}
mkdir -p scripts docs

# 6. Setup TypeScript
pnpm install

# 7. First build
pnpm build

# 8. Start implementing patterns
```

---

## ✅ Checklist: Patterns to Clone

- [ ] Plugin Registry pattern
- [ ] Dependency Injection pattern
- [ ] Event Emitter pattern
- [ ] Error Handling pattern
- [ ] Retry logic pattern
- [ ] TypeScript configuration
- [ ] Linting configuration
- [ ] Testing setup (vitest)
- [ ] TypeBox schemas pattern
- [ ] CLI structure pattern

---

## ❌ Don't Clone

- ❌ Channel implementations (Telegram, Discord code)
- ❌ File-based storage
- ❌ SQLite setup
- ❌ External API integrations (unless learning)
- ❌ UI code
- ❌ Entire folder structures

---

## 📚 Reference OpenClaw Files

Keep these files open untuk reference:

```
openclaw-reference/
├── src/channels/registry.ts         ← Plugin pattern
├── src/infra/deps.ts                ← Dependency injection
├── src/gateway/gateway.ts           ← Event-driven
├── src/infra/error.ts               ← Error handling
├── src/terminal/palette.ts          ← CLI pattern
├── src/channels/types.ts            ← Interface definitions
├── tsconfig.json                    ← TS config
├── oxlint.json                      ← Lint config
├── package.json                     ← Dependencies
└── AGENTS.md                        ← Development guide
```

---

**Document Version**: 1.0  
**Created**: February 10, 2025
