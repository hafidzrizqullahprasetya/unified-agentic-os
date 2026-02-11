# Database Schema: Unified-Agentic-OS

**Date**: February 10, 2026  
**Project**: Unified-Agentic-OS  
**Phase**: Phase 1 (Day 10 - Database Design)  
**Technology**: PostgreSQL + Drizzle ORM (TypeScript)  
**Status**: Complete schema design with migrations

---

## TABLE OF CONTENTS

1. [Schema Overview](#schema-overview)
2. [Core Tables](#core-tables)
3. [Relationships & Foreign Keys](#relationships--foreign-keys)
4. [Indexes & Performance](#indexes--performance)
5. [Drizzle ORM Configuration](#drizzle-orm-configuration)
6. [Migration Strategy](#migration-strategy)
7. [Seed Data](#seed-data)
8. [Data Validation Rules](#data-validation-rules)

---

## SCHEMA OVERVIEW

### Database Design Principles

1. **ACID Compliance**: PostgreSQL for transaction safety (critical for payments)
2. **Normalization**: 3NF to avoid data redundancy
3. **Audit Trail**: All changes tracked via `createdAt`, `updatedAt`, audit log
4. **Soft Deletes**: Mark deleted records instead of removing (for audit)
5. **JSON Fields**: Store flexible data (metadata, context) in JSONB
6. **Indexes**: Optimize common queries (customer lookups, order filtering)
7. **Partitioning**: Plan for monthly partitioning of large tables (orders, events)

### Table Categories

```
├── Core Tables (Mandatory)
│   ├── users
│   ├── stores
│   ├── customers
│   ├── products
│   └── inventory
│
├── Commerce Tables
│   ├── orders
│   ├── order_items
│   └── order_status_history
│
├── Payment Tables
│   ├── payments
│   ├── payment_methods
│   ├── refunds
│   └── payment_webhook_logs
│
├── Inventory Tables
│   ├── inventory_reservations
│   ├── inventory_movements
│   └── product_variants
│
├── Audit & Compliance
│   ├── event_audit_log
│   ├── customer_messages
│   ├── payment_audit_log
│   └── system_logs
│
└── Analytics & Context
    ├── customer_preferences
    ├── order_metrics
    └── payment_metrics
```

---

## CORE TABLES

### 1. Users (Store Owners)

```typescript
// src/db/schema/users.ts
import { pgTable, text, timestamp, boolean, json } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  
  // Auth
  emailVerified: boolean('email_verified').default(false),
  emailVerifiedAt: timestamp('email_verified_at'),
  phoneVerified: boolean('phone_verified').default(false),
  
  // Store info
  storeId: text('store_id'),
  role: text('role').default('owner'), // 'owner', 'admin', 'staff'
  
  // Preferences
  language: text('language').default('id'), // 'id', 'en'
  timezone: text('timezone').default('Asia/Jakarta'),
  theme: text('theme').default('light'), // 'light', 'dark'
  
  // Account status
  status: text('status').default('active'), // 'active', 'suspended', 'deleted'
  lastLoginAt: timestamp('last_login_at'),
  
  // Metadata
  metadata: json('metadata'), // Any additional data
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
```

### 2. Stores (UMKM Business)

```typescript
// src/db/schema/stores.ts
export const stores = pgTable('stores', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  ownerId: text('owner_id').notNull().references(() => users.id),
  
  // Store info
  name: text('name').notNull(),
  description: text('description'),
  slug: text('slug').notNull().unique(), // URL-friendly name
  
  // Contact
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  address: text('address'),
  city: text('city'),
  province: text('province'),
  zipCode: text('zip_code'),
  
  // Business
  businessType: text('business_type'), // 'retail', 'food', 'service', etc
  taxId: text('tax_id'), // NPWP/NPPKP for Indonesia
  bankAccount: json('bank_account'), // { bankName, accountNumber, accountHolder }
  
  // Channel configuration
  whatsappNumber: text('whatsapp_number'),
  telegramUsername: text('telegram_username'),
  instagramHandle: text('instagram_handle'),
  
  // Settings
  currency: text('currency').default('IDR'),
  taxRate: integer('tax_rate').default(12), // PPN 12% for Indonesia
  autoReplyMessage: text('auto_reply_message'),
  
  // Status
  status: text('status').default('active'), // 'active', 'suspended', 'deleted'
  
  // Logo & branding
  logoUrl: text('logo_url'),
  coverImageUrl: text('cover_image_url'),
  
  metadata: json('metadata'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Store = typeof stores.$inferSelect;
export type InsertStore = typeof stores.$inferInsert;
```

### 3. Customers

```typescript
// src/db/schema/customers.ts
export const customers = pgTable('customers', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  storeId: text('store_id').notNull().references(() => stores.id),
  
  // Contact
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone').notNull(),
  
  // Channel identifiers
  channelIds: json('channel_ids'), // { whatsapp: '123456', telegram: '@user', discord: 'user#1234' }
  
  // Address
  address: text('address'),
  city: text('city'),
  province: text('province'),
  zipCode: text('zip_code'),
  
  // Preferences
  preferences: json('preferences'), // { language: 'id', paymentMethod: 'qris', defaultAddress: 'id' }
  
  // Stats
  totalSpent: integer('total_spent').default(0), // In cents
  orderCount: integer('order_count').default(0),
  lastOrderAt: timestamp('last_order_at'),
  
  // Segments
  segment: text('segment'), // 'new', 'regular', 'vip'
  
  // Status
  status: text('status').default('active'), // 'active', 'inactive', 'blocked'
  
  metadata: json('metadata'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;
```

### 4. Products

```typescript
// src/db/schema/products.ts
export const products = pgTable('products', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  storeId: text('store_id').notNull().references(() => stores.id),
  
  // Product info
  name: text('name').notNull(),
  description: text('description'),
  sku: text('sku'),
  barcode: text('barcode'),
  
  // Pricing
  price: integer('price').notNull(), // In cents (Rp)
  costPrice: integer('cost_price'), // For profit calculation
  currency: text('currency').default('IDR'),
  
  // Stock
  stock: integer('stock').notNull().default(0),
  reorderLevel: integer('reorder_level').default(10),
  
  // Categorization
  categoryId: text('category_id'),
  tags: json('tags'), // ['teh', 'organic', 'hot-drink']
  
  // Media
  imageUrl: text('image_url'),
  imageUrls: json('image_urls'), // Multiple images
  
  // Variants (optional)
  hasVariants: boolean('has_variants').default(false),
  
  // Status
  status: text('status').default('active'), // 'active', 'archived', 'discontinued'
  
  metadata: json('metadata'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
```

### 5. Product Variants (Optional)

```typescript
// src/db/schema/product-variants.ts
export const productVariants = pgTable('product_variants', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  productId: text('product_id').notNull().references(() => products.id),
  
  // Variant info
  name: text('name').notNull(), // 'Size: Large', 'Color: Red'
  sku: text('sku'),
  
  // Pricing
  price: integer('price'), // If different from base product
  
  // Stock
  stock: integer('stock').notNull().default(0),
  
  // Attributes
  attributes: json('attributes'), // { size: 'large', color: 'red' }
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

---

## COMMERCE TABLES

### 6. Orders

```typescript
// src/db/schema/orders.ts
export const orders = pgTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  storeId: text('store_id').notNull().references(() => stores.id),
  customerId: text('customer_id').notNull().references(() => customers.id),
  
  // Order info
  orderNumber: text('order_number').notNull(), // User-friendly: ORD-2026-0001
  
  // Amounts (all in cents)
  subtotal: integer('subtotal').notNull(), // Sum of items
  taxAmount: integer('tax_amount').notNull().default(0),
  discountAmount: integer('discount_amount').default(0),
  shippingCost: integer('shipping_cost').default(0),
  totalAmount: integer('total_amount').notNull(), // subtotal + tax + shipping - discount
  currency: text('currency').default('IDR'),
  
  // Status
  status: text('status').notNull().default('created'), 
  // 'created', 'payment_initiated', 'paid', 'packed', 'shipped', 'delivered', 'completed', 'cancelled'
  
  // Payment
  paymentId: text('payment_id').references(() => payments.id),
  paymentMethod: text('payment_method'), // 'qris', 'bank_transfer', 'ewallet', 'card'
  
  // Shipping
  shippingAddress: json('shipping_address').notNull(), // { street, city, zip, name, phone }
  shippingMethod: text('shipping_method'), // 'jne', 'grab', 'local'
  trackingNumber: text('tracking_number'),
  
  // Notes
  customerNote: text('customer_note'),
  internalNote: text('internal_note'),
  
  // Metadata
  items: json('items'), // Denormalized: [{ productId, name, price, quantity }]
  metadata: json('metadata'),
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  paidAt: timestamp('paid_at'),
  packedAt: timestamp('packed_at'),
  shippedAt: timestamp('shipped_at'),
  deliveredAt: timestamp('delivered_at'),
  cancelledAt: timestamp('cancelled_at'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
```

### 7. Order Items (Normalized)

```typescript
// src/db/schema/order-items.ts
export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  orderId: text('order_id').notNull().references(() => orders.id),
  productId: text('product_id').notNull().references(() => products.id),
  
  // Item details
  quantity: integer('quantity').notNull(),
  price: integer('price').notNull(), // Price at time of purchase
  subtotal: integer('subtotal').notNull(), // quantity * price
  
  // Variant (optional)
  variantId: text('variant_id'),
  variantName: text('variant_name'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

### 8. Order Status History

```typescript
// src/db/schema/order-status-history.ts
export const orderStatusHistory = pgTable('order_status_history', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  orderId: text('order_id').notNull().references(() => orders.id),
  
  // Status change
  previousStatus: text('previous_status'),
  newStatus: text('new_status').notNull(),
  
  // Details
  reason: text('reason'),
  changedBy: text('changed_by'), // 'system', 'user_id'
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

---

## PAYMENT TABLES

### 9. Payments

```typescript
// src/db/schema/payments.ts
export const payments = pgTable('payments', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  storeId: text('store_id').notNull().references(() => stores.id),
  orderId: text('order_id').notNull().references(() => orders.id),
  
  // Payment identification
  externalId: text('external_id'), // Gateway's transaction ID (e.g., Xendit ID)
  referenceNumber: text('reference_number'), // Our internal reference
  
  // Amount
  amount: integer('amount').notNull(), // In cents
  currency: text('currency').default('IDR'),
  
  // Gateway
  gateway: text('gateway').notNull(), // 'stripe', 'xendit', 'qris', 'bank_transfer'
  gatewayResponse: json('gateway_response'), // Full response from gateway
  
  // Method
  method: text('method').notNull(), // 'card', 'bank_transfer', 'ewallet', 'qris'
  
  // Details (flexible per gateway)
  details: json('details'), // { cardLast4, bankName, ewalletType, qrisCode }
  
  // Status
  status: text('status').notNull().default('pending'),
  // 'pending', 'confirmed', 'failed', 'expired', 'cancelled', 'refunded'
  
  // Retry info
  attemptCount: integer('attempt_count').default(0),
  lastAttemptAt: timestamp('last_attempt_at'),
  lastAttemptError: text('last_attempt_error'),
  
  // Webhook
  webhookReceived: boolean('webhook_received').default(false),
  webhookReceivedAt: timestamp('webhook_received_at'),
  
  metadata: json('metadata'),
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  confirmedAt: timestamp('confirmed_at'),
  failedAt: timestamp('failed_at'),
  expiresAt: timestamp('expires_at'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
```

### 10. Payment Methods (Customer's Saved Methods)

```typescript
// src/db/schema/payment-methods.ts
export const paymentMethods = pgTable('payment_methods', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  customerId: text('customer_id').notNull().references(() => customers.id),
  
  // Type
  type: text('type').notNull(), // 'card', 'bank_account', 'ewallet'
  
  // Gateway token (don't store raw card data!)
  gatewayToken: text('gateway_token').notNull(), // Stripe token, Xendit ID, etc
  gateway: text('gateway').notNull(), // 'stripe', 'xendit'
  
  // Display info
  displayName: text('display_name'), // 'Visa ending in 4242'
  last4: text('last_4'),
  
  // Status
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

### 11. Refunds

```typescript
// src/db/schema/refunds.ts
export const refunds = pgTable('refunds', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  paymentId: text('payment_id').notNull().references(() => payments.id),
  orderId: text('order_id').notNull().references(() => orders.id),
  
  // Amount
  amount: integer('amount').notNull(),
  currency: text('currency').default('IDR'),
  
  // Reason
  reason: text('reason').notNull(), // 'customer_request', 'product_defective', 'out_of_stock'
  description: text('description'),
  
  // Status
  status: text('status').notNull().default('pending'),
  // 'pending', 'processed', 'failed'
  
  // Gateway
  externalId: text('external_id'), // Gateway refund ID
  
  metadata: json('metadata'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  processedAt: timestamp('processed_at'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

### 12. Payment Webhook Logs

```typescript
// src/db/schema/payment-webhook-logs.ts
export const paymentWebhookLogs = pgTable('payment_webhook_logs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  
  // Webhook info
  gateway: text('gateway').notNull(),
  eventType: text('event_type').notNull(), // 'payment.completed', 'payment.failed'
  
  // Raw data
  payload: json('payload').notNull(),
  signature: text('signature'),
  signatureValid: boolean('signature_valid'),
  
  // Processing
  processed: boolean('processed').default(false),
  processedAt: timestamp('processed_at'),
  error: text('error'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

---

## INVENTORY TABLES

### 13. Inventory Reservations

```typescript
// src/db/schema/inventory-reservations.ts
export const inventoryReservations = pgTable('inventory_reservations', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  orderId: text('order_id').notNull().references(() => orders.id),
  productId: text('product_id').notNull().references(() => products.id),
  
  // Quantity
  quantity: integer('quantity').notNull(),
  
  // Status
  status: text('status').notNull().default('reserved'),
  // 'reserved', 'committed', 'released', 'cancelled'
  
  // Dates
  createdAt: timestamp('created_at').notNull().defaultNow(),
  releasedAt: timestamp('released_at'),
  committedAt: timestamp('committed_at'),
});
```

### 14. Inventory Movements

```typescript
// src/db/schema/inventory-movements.ts
export const inventoryMovements = pgTable('inventory_movements', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  productId: text('product_id').notNull().references(() => products.id),
  
  // Movement
  type: text('type').notNull(), // 'inbound', 'outbound', 'adjustment', 'reservation', 'return'
  quantity: integer('quantity').notNull(),
  
  // Reference
  referenceType: text('reference_type'), // 'order', 'purchase', 'return', 'adjustment'
  referenceId: text('reference_id'),
  
  // Details
  reason: text('reason'),
  notes: text('notes'),
  
  // After movement
  stockBefore: integer('stock_before'),
  stockAfter: integer('stock_after'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

---

## AUDIT & COMPLIANCE TABLES

### 15. Event Audit Log

```typescript
// src/db/schema/event-audit-log.ts
export const eventAuditLog = pgTable('event_audit_log', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  
  // Event
  eventType: text('event_type').notNull(),
  // 'order:created', 'payment:confirmed', 'inventory:reserved', etc
  
  // Entity
  entityType: text('entity_type'), // 'order', 'payment', 'customer'
  entityId: text('entity_id'),
  
  // Details
  payload: json('payload').notNull(),
  
  // User
  userId: text('user_id'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Indexes for quick lookup
export const eventAuditLogIndexes = [
  index('idx_event_type').on(eventAuditLog.eventType),
  index('idx_entity').on(eventAuditLog.entityType, eventAuditLog.entityId),
];
```

### 16. Customer Messages

```typescript
// src/db/schema/customer-messages.ts
export const customerMessages = pgTable('customer_messages', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  storeId: text('store_id').notNull().references(() => stores.id),
  customerId: text('customer_id').notNull().references(() => customers.id),
  
  // Message
  text: text('text').notNull(),
  direction: text('direction').notNull(), // 'inbound', 'outbound'
  
  // Channel
  channel: text('channel').notNull(), // 'whatsapp', 'telegram', 'discord'
  channelMessageId: text('channel_message_id'),
  
  // Type
  type: text('type').default('text'), // 'text', 'image', 'file', 'button'
  
  // Metadata
  metadata: json('metadata'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

### 17. Payment Audit Log

```typescript
// src/db/schema/payment-audit-log.ts
export const paymentAuditLog = pgTable('payment_audit_log', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  paymentId: text('payment_id').notNull().references(() => payments.id),
  
  // Action
  action: text('action').notNull(), // 'created', 'confirmed', 'failed', 'retried'
  
  // Details
  previousStatus: text('previous_status'),
  newStatus: text('new_status'),
  details: json('details'),
  
  // Source
  source: text('source'), // 'webhook', 'api', 'system'
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

---

## RELATIONSHIPS & FOREIGN KEYS

```
users (1) ──→ (many) stores
users (1) ──→ (many) orders (indirectly, via store)

stores (1) ──→ (many) customers
stores (1) ──→ (many) products
stores (1) ──→ (many) orders
stores (1) ──→ (many) payments

customers (1) ──→ (many) orders
customers (1) ──→ (many) customerMessages
customers (1) ──→ (many) paymentMethods

products (1) ──→ (many) orderItems
products (1) ──→ (many) productVariants
products (1) ──→ (many) inventoryMovements

orders (1) ──→ (many) orderItems
orders (1) ──→ (many) payments
orders (1) ──→ (many) refunds
orders (1) ──→ (many) orderStatusHistory
orders (1) ──→ (many) inventoryReservations

payments (1) ──→ (many) refunds
payments (1) ──→ (many) paymentAuditLog
```

---

## INDEXES & PERFORMANCE

### Critical Indexes

```typescript
// src/db/schema/indexes.ts
import { index } from 'drizzle-orm/pg-core';

// Customer queries
export const customerIndexes = [
  index('idx_customers_store').on(customers.storeId),
  index('idx_customers_phone').on(customers.storeId, customers.phone),
  index('idx_customers_email').on(customers.storeId, customers.email),
  index('idx_customers_segment').on(customers.storeId, customers.segment),
];

// Order queries
export const orderIndexes = [
  index('idx_orders_store').on(orders.storeId),
  index('idx_orders_customer').on(orders.customerId),
  index('idx_orders_status').on(orders.storeId, orders.status),
  index('idx_orders_created').on(orders.storeId, orders.createdAt),
  index('idx_orders_payment').on(orders.paymentId),
];

// Payment queries
export const paymentIndexes = [
  index('idx_payments_order').on(payments.orderId),
  index('idx_payments_status').on(payments.storeId, payments.status),
  index('idx_payments_external').on(payments.gateway, payments.externalId),
  index('idx_payments_created').on(payments.createdAt),
];

// Product queries
export const productIndexes = [
  index('idx_products_store').on(products.storeId),
  index('idx_products_status').on(products.storeId, products.status),
  index('idx_products_sku').on(products.storeId, products.sku),
];

// Inventory queries
export const inventoryIndexes = [
  index('idx_reservations_order').on(inventoryReservations.orderId),
  index('idx_reservations_product').on(inventoryReservations.productId),
  index('idx_movements_product').on(inventoryMovements.productId),
  index('idx_movements_type').on(inventoryMovements.type),
];

// Message queries
export const messageIndexes = [
  index('idx_messages_customer').on(customerMessages.customerId),
  index('idx_messages_channel').on(customerMessages.storeId, customerMessages.channel),
  index('idx_messages_created').on(customerMessages.createdAt),
];

// Audit queries
export const auditIndexes = [
  index('idx_audit_type_date').on(eventAuditLog.eventType, eventAuditLog.createdAt),
  index('idx_audit_entity').on(eventAuditLog.entityType, eventAuditLog.entityId),
  index('idx_payment_audit').on(paymentAuditLog.paymentId),
];
```

### Query Performance Targets

```
Operation                  Target Time
─────────────────────────────────────
Get customer by ID         < 5ms
Get customer orders        < 20ms
Get order with items       < 10ms
Create order               < 50ms
Create payment             < 30ms
List products              < 30ms
Check inventory            < 5ms
Get payment status         < 10ms
```

---

## DRIZZLE ORM CONFIGURATION

### Setup

```typescript
// src/db/config.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const client = postgres(connectionString, {
  max: 10, // Connection pool size
  prepare: true, // Use prepared statements
});

export const db = drizzle(client, { schema });

export type Database = typeof db;
```

### Types

```typescript
// src/db/types.ts
export * from './schema';

// Helper types
export type SelectUser = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
// ... more exports
```

### Usage Example

```typescript
// src/services/customer.service.ts
import { db } from '@/db/config';
import { customers, orders } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function getCustomerWithOrders(customerId: string) {
  const customer = await db
    .select()
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);

  const customerOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, customerId))
    .orderBy(desc(orders.createdAt))
    .limit(10);

  return {
    customer: customer[0],
    recentOrders: customerOrders,
  };
}

export async function createCustomer(data: InsertCustomer) {
  const [newCustomer] = await db
    .insert(customers)
    .values(data)
    .returning();

  return newCustomer;
}
```

---

## MIGRATION STRATEGY

### Initial Migrations

```typescript
// src/db/migrations/0001_init.sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  store_id TEXT,
  role TEXT DEFAULT 'owner',
  language TEXT DEFAULT 'id',
  timezone TEXT DEFAULT 'Asia/Jakarta',
  theme TEXT DEFAULT 'light',
  status TEXT DEFAULT 'active',
  last_login_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Similar for other tables...
CREATE INDEX idx_users_email ON users(email);
```

### Migration Tool

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema',
  out: './src/db/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

### Commands

```bash
# Generate migrations
pnpm drizzle-kit generate:pg --name init

# Apply migrations
pnpm drizzle-kit migrate

# Push schema (development only)
pnpm drizzle-kit push:pg

# Introspect existing database
pnpm drizzle-kit introspect:pg
```

---

## SEED DATA

### Development Seed

```typescript
// src/db/seed.ts
import { db } from '@/db/config';
import { users, stores, customers, products } from '@/db/schema';

export async function seedDatabase() {
  console.log('🌱 Seeding database...');

  // Create test user
  const [user] = await db
    .insert(users)
    .values({
      email: 'owner@example.com',
      phone: '081234567890',
      name: 'Bella Teh',
      passwordHash: 'hashed_password',
      emailVerified: true,
    })
    .returning();

  console.log('✅ User created:', user.id);

  // Create store
  const [store] = await db
    .insert(stores)
    .values({
      ownerId: user.id,
      name: 'Bella Teh Indonesia',
      slug: 'bella-teh',
      email: 'store@example.com',
      phone: '081234567890',
      businessType: 'food',
      whatsappNumber: '081234567890',
    })
    .returning();

  console.log('✅ Store created:', store.id);

  // Create sample customers
  const customerData = [
    {
      storeId: store.id,
      name: 'Ahmad',
      phone: '081234567891',
      segment: 'regular',
    },
    {
      storeId: store.id,
      name: 'Siti',
      phone: '081234567892',
      segment: 'vip',
    },
  ];

  const inserted = await db
    .insert(customers)
    .values(customerData)
    .returning();

  console.log('✅ Customers created:', inserted.length);

  // Create sample products
  const productData = [
    {
      storeId: store.id,
      name: 'Teh Hijau Organik',
      price: 50000, // Rp 50,000
      costPrice: 20000,
      stock: 100,
      reorderLevel: 20,
    },
    {
      storeId: store.id,
      name: 'Teh Putih Premium',
      price: 75000,
      costPrice: 30000,
      stock: 50,
      reorderLevel: 15,
    },
  ];

  const products_ = await db
    .insert(products)
    .values(productData)
    .returning();

  console.log('✅ Products created:', products_.length);
  console.log('✅ Database seeded!');
}

// Run: pnpm tsx src/db/seed.ts
```

---

## DATA VALIDATION RULES

### Business Rules

```typescript
// src/db/validators.ts

// Order validation
export function validateOrder(order: InsertOrder) {
  const errors: string[] = [];

  if (order.totalAmount <= 0) {
    errors.push('Total amount must be positive');
  }

  if (!order.customerId) {
    errors.push('Customer ID is required');
  }

  if (!order.shippingAddress) {
    errors.push('Shipping address is required');
  }

  return errors;
}

// Payment validation
export function validatePayment(payment: InsertPayment) {
  const errors: string[] = [];

  if (payment.amount <= 0) {
    errors.push('Payment amount must be positive');
  }

  if (!['stripe', 'xendit', 'qris'].includes(payment.gateway)) {
    errors.push('Invalid payment gateway');
  }

  return errors;
}

// Inventory validation
export function validateReservation(
  reservation: InsertInventoryReservation,
  availableStock: number
) {
  const errors: string[] = [];

  if (reservation.quantity <= 0) {
    errors.push('Quantity must be positive');
  }

  if (reservation.quantity > availableStock) {
    errors.push('Insufficient stock');
  }

  return errors;
}
```

---

## NEXT STEPS

### Day 10 Complete ✅
- [x] Core tables (users, stores, customers, products)
- [x] Commerce tables (orders, order items)
- [x] Payment tables (payments, refunds, webhooks)
- [x] Inventory tables (reservations, movements)
- [x] Audit tables (event log, messages, payment audit)
- [x] Indexes and performance optimization
- [x] Drizzle ORM configuration
- [x] Migration strategy
- [x] Seed data for development

### Day 11: API Endpoints
- REST endpoint specifications
- Request/response examples
- Error handling

### Day 12-14: Project Setup
- Initialize Hono server
- Integrate database
- Create base services
- Set up Docker
- Deploy

---

**Document Status**: Day 10 Complete ✅  
**Next Document**: API-ENDPOINTS.md (Day 11)  
**Author**: AI Database Design Agent  
**Date**: February 10, 2026
