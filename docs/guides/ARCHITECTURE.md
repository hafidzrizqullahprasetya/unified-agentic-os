# Architecture: Unified-Agentic-OS

**Date**: February 10, 2026  
**Project**: Unified-Agentic-OS  
**Phase**: Phase 1 (Architecture Design - Day 8-9)  
**Status**: Detailed system architecture document

---

## TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Core Components](#core-components)
4. [Data Flow](#data-flow)
5. [Technology Stack](#technology-stack)
6. [Database Design](#database-design)
7. [API Architecture](#api-architecture)
8. [Event System](#event-system)
9. [Deployment Architecture](#deployment-architecture)
10. [Scalability Considerations](#scalability-considerations)

---

## SYSTEM OVERVIEW

### Purpose
Unified-Agentic-OS is a unified commerce platform combining messaging, payments, inventory, and AI to enable UMKM Indonesia to run their business via chat.

### Core Tenets
1. **Chat-native**: Everything starts with a conversation
2. **Context-aware**: AI understands customer, order, and inventory context
3. **Multi-channel**: Works on WhatsApp, Telegram, Discord, Email
4. **Indonesia-optimized**: QRIS, Xendit, local payment methods
5. **Event-driven**: Loose coupling between components
6. **Extensible**: Plugin system for gateways, channels, workflows

### Scale Target (Year 1)
- 10,000 UMKM sellers using platform
- 50,000 monthly active customers
- $100K MRR from transaction fees + subscription
- <100ms response time for core operations
- 99.5% payment processing success rate

---

## HIGH-LEVEL ARCHITECTURE

```
┌──────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SYSTEMS                          │
│  ┌──────────┐  ┌──────────┐  ┌──────┐  ┌──────────────────────┐│
│  │WhatsApp  │  │Telegram  │  │Chat  │  │Payment Gateways      ││
│  │ Web API  │  │Bot API   │  │APIs  │  │(Stripe, Xendit, etc) ││
│  └──────────┘  └──────────┘  └──────┘  └──────────────────────┘│
│  ┌──────────┐  ┌──────────┐  ┌──────┐  ┌──────────────────────┐│
│  │Shipping  │  │Tax/Audit │  │CRM   │  │Accounting Software   ││
│  │APIs      │  │Systems   │  │APIs  │  │(Jurnal, Accurate)    ││
│  └──────────┘  └──────────┘  └──────┘  └──────────────────────┘│
└──────────────────────────┬───────────────────────────────────────┘
                           │
            ┌──────────────▼──────────────┐
            │    API Gateway / Router     │
            │ (Authentication, Rate limit)│
            └──────────────┬──────────────┘
                           │
            ┌──────────────▼──────────────┐
            │  MESSAGE INGEST LAYER      │
            │ ┌────────────────────────┐ │
            │ │ Channel Adapters       │ │
            │ │ (WhatsApp, Telegram)   │ │
            │ └────────────────────────┘ │
            │ ┌────────────────────────┐ │
            │ │ Message Normalization  │ │
            │ │ (to internal format)   │ │
            │ └────────────────────────┘ │
            └──────────────┬──────────────┘
                           │
            ┌──────────────▼──────────────┐
            │    EVENT BUS / QUEUE        │
            │ (PubSub, async processing) │
            └──────────────┬──────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
   │  AI     │       │ Commerce│       │ Workflow│
   │ Agent   │       │ Service │       │ Engine  │
   └────┬────┘       └────┬────┘       └────┬────┘
        │                 │                 │
   ┌────▼────────────────▼────────────────▼────┐
   │         EVENT HANDLERS / WORKERS          │
   │ ┌────────────────────────────────────────┐│
   │ │ Payment Processor (+ retry logic)      ││
   │ │ Order State Machine                    ││
   │ │ Inventory Manager                      ││
   │ │ Notification Service                   ││
   │ │ Audit Logger                           ││
   │ └────────────────────────────────────────┘│
   └────┬────────────────────────────────────────┘
        │
   ┌────▼────────────────────────────────────────┐
   │        PERSISTENT DATA LAYER               │
   │ ┌───────────────────────────────────────┐  │
   │ │ PostgreSQL Database                   │  │
   │ │ (Orders, customers, inventory, etc)   │  │
   │ └───────────────────────────────────────┘  │
   │ ┌───────────────────────────────────────┐  │
   │ │ Cache Layer (Redis)                   │  │
   │ │ (Customer context, session data)      │  │
   │ └───────────────────────────────────────┘  │
   │ ┌───────────────────────────────────────┐  │
   │ │ File Storage (S3/Cloud)               │  │
   │ │ (Receipts, invoices, media)           │  │
   │ └───────────────────────────────────────┘  │
   └──────────────────────────────────────────┘
```

---

## CORE COMPONENTS

### 1. Message Ingest Layer

**Purpose**: Receive messages from multiple channels and normalize to internal format

```
Inputs:
- WhatsApp Web (via WhatsApp Web Browser API)
- Telegram Bot API (webhooks)
- Discord Bot (WebSocket)
- Email (SMTP parsing)
- REST API (for custom integrations)

Processing:
1. Normalize message format (text, images, files)
2. Extract sender ID, channel, timestamp
3. Emit 'message:received' event to event bus
4. Queue for processing

Output:
- Internal message format → Event Bus
```

**Key Classes**:
- `ChannelAdapter<T>` - Abstract base for channel integration
- `WhatsAppAdapter` extends `ChannelAdapter`
- `TelegramAdapter` extends `ChannelAdapter`
- `MessageNormalizer` - Convert to standard format

### 2. AI Agent Service

**Purpose**: Process customer messages with business context

```
Input: Customer message (+ context)

Processing:
1. Identify customer (by phone, email, chat ID)
2. Load customer context (history, preferences)
3. Load relevant order/inventory context
4. Send to LLM (with system prompt)
5. Execute tool calls (check inventory, create order, etc)
6. Generate response

Output: Response text → Send to customer via channel
```

**System Prompt**:
```
You are a helpful sales and support agent for an UMKM business.

Context:
- Customer: Bella, frequent buyer (5 orders, Rp 500K spent)
- Recent order: Order #123, paid, waiting to ship
- Available products: Teh Hijau (10 stock), Teh Putih (5 stock)
- Promotions: 20% loyalty discount for repeat customers

Tools available:
- checkInventory(productId)
- getOrderStatus(orderId)
- createOrder(customerId, items)
- processPayment(orderId, method)
- getCustomerProfile(customerId)
- applyPromotion(customerId, code)

Instructions:
1. Always provide personalized responses based on customer history
2. Recommend products based on preferences
3. Offer loyalty discounts for repeat customers
4. Suggest relevant upsells
5. Proactively offer help
6. Use Indonesian language
```

### 3. Commerce Service Layer

**Payment Service**:
- Process payments via multiple gateways
- Handle retries with exponential backoff
- Store payment records for audit
- Emit payment events (pending, confirmed, failed)

```typescript
interface PaymentService {
  process(orderId: string, amount: Amount, method: string): Promise<Payment>;
  refund(paymentId: string, amount?: Amount): Promise<Refund>;
  getStatus(paymentId: string): Promise<PaymentStatus>;
  handleWebhook(gateway: string, payload: unknown): Promise<void>;
}
```

**Order Service**:
- Create orders from chat
- Update order status through workflow
- Manage order-related data

```typescript
interface OrderService {
  create(customerId: string, items: OrderItem[]): Promise<Order>;
  getById(orderId: string): Promise<Order>;
  updateStatus(orderId: string, status: OrderStatus): Promise<void>;
  listByCustomer(customerId: string): Promise<Order[]>;
}
```

**Customer Service**:
- Store and retrieve customer data
- Track purchase history
- Manage preferences

```typescript
interface CustomerService {
  getById(customerId: string): Promise<Customer>;
  create(data: CustomerCreateInput): Promise<Customer>;
  updatePreferences(customerId: string, prefs: Preferences): Promise<void>;
  getPurchaseHistory(customerId: string): Promise<Order[]>;
}
```

**Inventory Service**:
- Real-time stock tracking
- Reservation management
- Low-stock alerts

```typescript
interface InventoryService {
  getStock(productId: string): Promise<number>;
  reserve(productId: string, quantity: number, orderId: string): Promise<void>;
  release(productId: string, quantity: number, orderId: string): Promise<void>;
  getLowStockProducts(): Promise<Product[]>;
}
```

### 4. Event Bus / Message Queue

**Purpose**: Decouple components via event-driven architecture

**Events**:
```typescript
type CommerceEvent = 
  // Customer
  | { type: 'customer:created'; customerId: string }
  
  // Order lifecycle
  | { type: 'order:created'; orderId: string; customerId: string }
  | { type: 'order:payment_initiated'; orderId: string }
  | { type: 'order:payment_confirmed'; orderId: string; paymentId: string }
  | { type: 'order:packed'; orderId: string }
  | { type: 'order:shipped'; orderId: string; tracking: string }
  | { type: 'order:delivered'; orderId: string }
  
  // Payment
  | { type: 'payment:webhook_received'; paymentId: string; gateway: string }
  | { type: 'payment:confirmed'; paymentId: string; amount: Amount }
  
  // Inventory
  | { type: 'inventory:reserved'; productId: string; quantity: number }
  | { type: 'inventory:released'; productId: string; quantity: number }
  
  // AI Agent
  | { type: 'agent:message_received'; customerId: string; text: string }
  | { type: 'agent:response_sent'; customerId: string; response: string }
```

**Implementation Options**:
- In-memory (for development): Simple Map-based PubSub
- RabbitMQ (production): Reliable, ordered, persistent
- Kafka (high-scale): Distributed, stream-based
- Redis Streams (hybrid): Fast, persistent, ordered

### 5. Workflow Engine

**Purpose**: Orchestrate multi-step business processes

**State Machine**:
```
Created → Payment Initiated → Paid → Packed → Shipped → Delivered → Completed
   ↓
   └──────────────────────────────────────────→ Cancelled
```

**Transitions**:
```typescript
interface WorkflowTransition {
  from: OrderStatus;
  to: OrderStatus;
  trigger: string;  // 'payment_received', 'user_confirmation', etc
  canTransition: (order: Order) => boolean;
  onEnter: (order: Order) => Promise<void>;  // Side effects
  onExit: (order: Order) => Promise<void>;
}
```

**Usage**:
```typescript
// When payment webhook received
eventBus.on('payment:webhook_received', async (event) => {
  const payment = await paymentService.getStatus(event.paymentId);
  if (payment.status === 'confirmed') {
    // Trigger transition
    await workflowEngine.transition({
      orderId: payment.orderId,
      from: 'initiated',
      to: 'paid',
      trigger: 'payment_confirmed',
    });
    // Side effects: warehouse notification, customer message, etc
  }
});
```

---

## DATA FLOW

### Customer Places Order

```
1. Customer: "Pesan 2 teh hijau"
   ↓
2. [Channel Adapter] Receive WhatsApp message
   ↓
3. [Message Ingest] Normalize, extract sender ID
   ↓
4. [Event Bus] Emit 'agent:message_received'
   ↓
5. [AI Agent] Load customer context
   - Customer profile (Bella, 5 orders, likes teh)
   - Inventory context (10 teh hijau in stock)
   - Available promotions (20% loyalty discount)
   ↓
6. [AI Agent] Generate response
   - Recognize order intent
   - Check inventory
   - Calculate price with discount
   - Confirm order
   ↓
7. [Order Service] Create order
   - Save to database: Order #456, 2x Teh Hijau, Rp 90K (with discount)
   ↓
8. [Inventory Service] Reserve inventory
   - Reserve 2x Teh Hijau
   ↓
9. [Event Bus] Emit 'order:created', 'inventory:reserved'
   ↓
10. [AI Agent] Send response
    "Pesanan kamu: 2x Teh Hijau, Rp 90K. Bayar via QRIS? [Button]"
    ↓
11. [Channel Adapter] Send via WhatsApp
```

### Customer Pays

```
1. Customer clicks QRIS button, scans code in-app
   ↓
2. [Payment Gateway Webhook] Xendit notifies: payment confirmed
   ↓
3. [API Gateway] Validate webhook signature
   ↓
4. [Payment Service] Handle webhook
   - Create Payment record
   - Update status: confirmed
   ↓
5. [Event Bus] Emit 'payment:confirmed'
   ↓
6. [Workflow Engine] Transition Order: initiated → paid
   ↓
7. [Order Service] Update Order.status = 'paid'
   ↓
8. [Event Bus] Emit 'order:payment_confirmed'
   ↓
9. [Notification Service] Listens to event
   - Send message to customer: "Pembayaran dikonfirmasi! ✓"
   - Notify warehouse: "Pack Order #456"
   ↓
10. [Inventory Service] Release reservation (now committed)
```

### Warehouse Ships Order

```
1. Warehouse worker packs and scans barcode
   ↓
2. [Warehouse System] (or manual via command) Update: Order #456 packed
   ↓
3. [Order Service] Update Order.status = 'packed'
   ↓
4. [Event Bus] Emit 'order:packed'
   ↓
5. [Shipping Service] Create shipping label
   - Call JNE/Grab API
   - Generate tracking number
   ↓
6. [Workflow Engine] Transition: packed → shipped
   ↓
7. [Event Bus] Emit 'order:shipped'
   ↓
8. [Notification Service]
   - Send customer: "Paket dikirim! Tracking: JNE123"
   - Include real-time tracking link
   ↓
9. [Message Service] Send via WhatsApp with tracking button
```

### Customer Receives Order

```
1. Delivery confirmed by courier
   ↓
2. [Workflow Engine] Transition: shipped → delivered
   ↓
3. [Event Bus] Emit 'order:delivered'
   ↓
4. [AI Agent] Send message
   - "Terima kasih! Gimana produknya? ⭐"
   - Suggest related products
   - Offer review incentive
   ↓
5. [Notification Service] 
   - Log order as completed
   - Update customer stats
   - Suggest related products based on purchase
```

---

## TECHNOLOGY STACK

### Backend
- **Runtime**: Node.js 22+ (LTS)
- **Language**: TypeScript (strict mode)
- **Framework**: Hono (lightweight, type-safe HTTP)
- **Database ORM**: Drizzle ORM (type-safe queries)
- **Database**: PostgreSQL 15+ (ACID, reliable)
- **Cache**: Redis (session, rate limits, caching)
- **Message Queue**: RabbitMQ (reliable event bus) or Redis Streams
- **Worker**: Bull (job processing) or Temporal (complex workflows)

### Frontend
- **Admin Dashboard**: Next.js 14 + React 19
- **Mobile**: React Native or Flutter (future)
- **Chat Interface**: Embedded in WhatsApp/Telegram (not custom UI)

### Infrastructure
- **Hosting**: Vercel (frontend) + Railway/Render (backend)
- **Database**: Supabase (PostgreSQL) or Railway PostgreSQL
- **Storage**: Vercel Blob or Cloudinary (images/files)
- **Monitoring**: Sentry (errors), LogRocket (frontend)
- **Analytics**: Mixpanel or Amplitude

### DevOps
- **Version Control**: Git + GitHub
- **CI/CD**: GitHub Actions
- **Testing**: Vitest (unit/integration), Playwright (e2e)
- **Linting**: ESLint + Prettier
- **Deployment**: Docker + Fly.io or Railway

---

## DATABASE DESIGN

### Core Tables

```typescript
// Customers
table('customers', {
  id: text().primaryKey(),
  email: text().unique(),
  phone: text(),
  name: text(),
  channelIds: json(), // { whatsapp: '123456', telegram: '@user' }
  preferences: json(), // { language: 'id', paymentMethod: 'qris' }
  createdAt: timestamp(),
  updatedAt: timestamp(),
});

// Products
table('products', {
  id: text().primaryKey(),
  storeId: text(), // For multi-tenant
  name: text(),
  description: text(),
  price: integer(), // In cents (Rp)
  stock: integer(),
  reorderLevel: integer(),
  imageUrl: text(),
  tags: json(),
  createdAt: timestamp(),
});

// Orders
table('orders', {
  id: text().primaryKey(),
  customerId: text(),
  storeId: text(),
  status: text(), // 'created', 'paid', 'packed', 'shipped', 'delivered', 'cancelled'
  totalAmount: integer(), // In cents
  currency: text(),
  taxAmount: integer(),
  discountAmount: integer(),
  items: json(), // [{ productId, quantity, price }]
  createdAt: timestamp(),
  paidAt: timestamp().nullable(),
  shippedAt: timestamp().nullable(),
  deliveredAt: timestamp().nullable(),
});

// Payments
table('payments', {
  id: text().primaryKey(),
  orderId: text(),
  storeId: text(),
  gateway: text(), // 'stripe', 'xendit', 'qris'
  externalId: text(), // Gateway's payment ID
  amount: integer(),
  currency: text(),
  status: text(), // 'pending', 'confirmed', 'failed', 'refunded'
  method: text(), // 'card', 'bank_transfer', 'ewallet'
  metadata: json(), // Gateway-specific data
  webhookPayload: json(), // Raw webhook for audit
  createdAt: timestamp(),
  confirmedAt: timestamp().nullable(),
  failedAt: timestamp().nullable(),
});

// Inventory Reservations
table('inventory_reservations', {
  id: text().primaryKey(),
  productId: text(),
  orderId: text(),
  quantity: integer(),
  status: text(), // 'reserved', 'committed', 'released', 'cancelled'
  createdAt: timestamp(),
  releasedAt: timestamp().nullable(),
});

// Event Audit Log
table('event_audit_log', {
  id: text().primaryKey(),
  eventType: text(),
  payload: json(),
  createdAt: timestamp(),
});

// Customer Messages
table('customer_messages', {
  id: text().primaryKey(),
  customerId: text(),
  channel: text(),
  direction: text(), // 'inbound', 'outbound'
  text: text(),
  metadata: json(),
  createdAt: timestamp(),
});
```

### Indexes

```sql
CREATE INDEX idx_orders_customer ON orders(customerId);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_payments_order ON payments(orderId);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_reservations_order ON inventory_reservations(orderId);
CREATE INDEX idx_audit_type_date ON event_audit_log(eventType, createdAt);
CREATE INDEX idx_messages_customer ON customer_messages(customerId);
```

---

## API ARCHITECTURE

### REST Endpoints (Internal)

```
POST /api/orders
  - Create order
  - Input: customerId, items
  - Output: Order with payment link

POST /api/orders/:orderId/payments
  - Initiate payment
  - Input: amount, method
  - Output: Payment with payment URL/QR code

POST /api/payments/webhooks/:gateway
  - Handle payment gateway webhook
  - Input: Raw webhook payload
  - Output: 200 OK (acknowledge receipt)

GET /api/customers/:customerId
  - Get customer details
  - Output: Customer with history

GET /api/products
  - List products
  - Query: storeId, search, tags
  - Output: Product[]

POST /api/agent/message
  - Send message to AI agent
  - Input: customerId, text, channel
  - Output: Response (text + recommended actions)
```

### WebSocket API (Real-time)

```typescript
// For real-time order updates, customer notifications
ws://api.example.com/ws/orders/:orderId
- 'order:updated' → broadcast current status
- 'payment:confirmed' → real-time notification

ws://api.example.com/ws/customers/:customerId/messages
- 'agent:response' → real-time AI response
- 'order:update' → order status update
```

---

## EVENT SYSTEM

### Event Types

```typescript
enum EventType {
  // Customer events
  CUSTOMER_CREATED = 'customer:created',
  CUSTOMER_UPDATED = 'customer:updated',
  
  // Order events
  ORDER_CREATED = 'order:created',
  ORDER_STATUS_CHANGED = 'order:status_changed',
  
  // Payment events
  PAYMENT_INITIATED = 'payment:initiated',
  PAYMENT_CONFIRMED = 'payment:confirmed',
  PAYMENT_FAILED = 'payment:failed',
  
  // Inventory events
  INVENTORY_RESERVED = 'inventory:reserved',
  INVENTORY_LOW = 'inventory:low_stock',
  
  // AI Agent events
  AGENT_MESSAGE_RECEIVED = 'agent:message_received',
  AGENT_RESPONSE_GENERATED = 'agent:response_generated',
}
```

### Event Handler Registration

```typescript
// Setup in main.ts
setupEventHandlers(deps);

// In event-handlers.ts
export function setupEventHandlers(deps: CommerceDeps) {
  deps.eventBus.on(EventType.ORDER_CREATED, handleOrderCreated);
  deps.eventBus.on(EventType.PAYMENT_CONFIRMED, handlePaymentConfirmed);
  deps.eventBus.on(EventType.INVENTORY_RESERVED, handleInventoryReserved);
  // ... more handlers
}
```

---

## DEPLOYMENT ARCHITECTURE

### Development
```
Local Machine
├── Node.js 22
├── PostgreSQL (Docker)
├── Redis (Docker)
└── Environment: .env.local
```

### Staging
```
Railway / Render
├── Backend: Node.js container
├── Database: PostgreSQL managed
├── Cache: Redis managed
├── Environment: .env.staging
└── Monitoring: Sentry
```

### Production
```
Fly.io / Railway
├── Backend: Multi-region Node.js
├── Database: PostgreSQL with backups
├── Cache: Redis cluster
├── CDN: Cloudflare
├── Environment: .env.production
├── Monitoring: Sentry, DataDog
├── Logs: LogDNA / Papertrail
└── Alerting: PagerDuty / Slack
```

### Deployment Process
```
1. Push to main branch
   ↓
2. GitHub Actions workflow triggered
   ↓
3. Run tests, lint, type check
   ↓
4. Build Docker image
   ↓
5. Push to container registry
   ↓
6. Deploy to staging
   ↓
7. Smoke tests
   ↓
8. Deploy to production (if approved)
   ↓
9. Health checks
   ↓
10. Rollback (if health check fails)
```

---

## SCALABILITY CONSIDERATIONS

### Database
- **Horizontal Scaling**: Read replicas for reporting
- **Partitioning**: Orders table partitioned by date
- **Caching**: Redis for hot data (customer context, inventory)
- **Query Optimization**: Indexes on common filters

### Message Queue
- **Scaling**: Multiple workers processing events in parallel
- **Dead Letter Queue**: Failed events for retry
- **Event Ordering**: Preserve order within customer context

### API Server
- **Load Balancing**: Multiple instances behind load balancer
- **Rate Limiting**: Per-customer, per-IP limits
- **Caching**: Cache customer context, product list
- **Async Processing**: Offload heavy operations to workers

### Payment Processing
- **Redundancy**: Multiple payment gateways (Stripe + Xendit + QRIS)
- **Retry Strategy**: Exponential backoff + jitter
- **Webhook Validation**: Verify signatures, replay protection
- **Idempotency**: Use idempotency keys to prevent duplicates

### Monitoring
- **Error Tracking**: Sentry for exceptions
- **Performance**: APM (New Relic, DataDog)
- **Logs**: Structured logging (JSON) to central aggregator
- **Alerts**: Slack/PagerDuty for critical issues

### Capacity Planning
```
Year 1: 10,000 sellers
- Peak concurrent users: 1,000
- Orders per day: 50,000
- Payment transactions: 25,000 (50% success first try)
- Payment retries: 12,500 (50% success on retry)
- Database size: ~50GB (orders, customers, logs)
- API requests/sec: 100 (sustained), 500 (peak)

Year 2: 100,000 sellers
- Peak concurrent users: 10,000
- Orders per day: 500,000
- Database size: ~500GB
- Need: Read replicas, partitioning, query optimization
- API requests/sec: 1,000 (sustained), 5,000 (peak)

Year 3: 1M sellers
- Full microservices architecture
- Kafka for event streaming
- Elasticsearch for logging
- GraphQL API alongside REST
```

---

## IMPLEMENTATION PHASES

### Phase 1: MVP (Week 1-4)
- Basic order flow (customer → payment → notification)
- Single payment gateway (QRIS or Xendit)
- WhatsApp/Telegram channels only
- No AI agent (basic responses)
- PostgreSQL + in-memory event bus

### Phase 2: Core Features (Week 5-8)
- AI agent with context awareness
- Multiple payment gateways
- Inventory management
- Customer profiles
- RabbitMQ for reliable events

### Phase 3: Scaling (Week 9-12)
- Performance optimizations
- Advanced analytics
- Multi-store support
- Mobile app
- Compliance features (SPT, tax reporting)

### Phase 4: Enterprise (Week 13-14)
- Microservices architecture (optional)
- Advanced workflows
- API for third-party integrations
- SaaS pricing models
- White-label support

---

## NEXT STEPS

### Day 10: Database Schema
- Detailed Drizzle ORM schema
- Migration strategy
- Seed data for testing

### Day 11: API Endpoints
- REST API spec
- Request/response examples
- Error handling

### Day 12-14: Project Setup
- Initialize Next.js + Hono project
- Set up database migrations
- Create base services
- Docker setup
- CI/CD pipeline

---

**Document Status**: Architecture design complete (Day 8-9)  
**Next Document**: DATABASE-SCHEMA.md (Day 10)  
**Author**: AI Architecture Agent  
**Date**: February 10, 2026
