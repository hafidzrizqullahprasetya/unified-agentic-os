# API Endpoints: Unified-Agentic-OS

**Date**: February 10, 2026  
**Project**: Unified-Agentic-OS  
**Phase**: Phase 1 (Day 11 - API Design)  
**Framework**: Hono (TypeScript HTTP framework)  
**Status**: Complete REST API specification

---

## TABLE OF CONTENTS

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Core Endpoints](#core-endpoints)
4. [Commerce Endpoints](#commerce-endpoints)
5. [Payment Endpoints](#payment-endpoints)
6. [Inventory Endpoints](#inventory-endpoints)
7. [Customer Endpoints](#customer-endpoints)
8. [AI Agent Endpoints](#ai-agent-endpoints)
9. [Admin Endpoints](#admin-endpoints)
10. [Error Handling](#error-handling)
11. [Rate Limiting](#rate-limiting)
12. [Webhooks](#webhooks)

---

## API OVERVIEW

### Base URL
```
Development: http://localhost:3000/api
Staging:     https://staging-api.unified-agentic-os.com/api
Production:  https://api.unified-agentic-os.com/api
```

### API Version
```
Current: v1
Header: Accept-Version: v1 (optional, defaults to v1)
```

### Response Format
All responses are JSON with consistent structure:

```json
{
  "success": true,
  "data": { /* response data */ },
  "meta": {
    "timestamp": "2026-02-10T12:00:00Z",
    "requestId": "req_123abc",
    "version": "v1"
  }
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "Order not found",
    "status": 404,
    "details": { /* additional info */ }
  },
  "meta": {
    "timestamp": "2026-02-10T12:00:00Z",
    "requestId": "req_123abc"
  }
}
```

---

## AUTHENTICATION

### JWT (Bearer Token)

All authenticated endpoints require:
```http
Authorization: Bearer <jwt_token>
```

### Token Claims
```typescript
interface JWTPayload {
  sub: string;              // user ID
  storeId: string;         // store ID
  email: string;
  role: 'owner' | 'admin' | 'staff';
  iat: number;             // issued at
  exp: number;             // expires at
  iss: 'unified-agentic-os';
}
```

### Refresh Token
```typescript
POST /auth/refresh
Body: { refreshToken: string }
Response: { accessToken: string, refreshToken: string }
```

---

## CORE ENDPOINTS

### 1. Authentication

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "owner@example.com",
  "phone": "081234567890",
  "name": "Bella Teh",
  "password": "secure_password_123",
  "storeName": "Bella Teh Indonesia"
}

Response 201:
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "owner@example.com",
      "name": "Bella Teh"
    },
    "store": {
      "id": "store_123",
      "name": "Bella Teh Indonesia"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "rt_abc123..."
  }
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "owner@example.com",
  "password": "secure_password_123"
}

Response 200:
{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "store": { /* store object */ },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": { "message": "Logged out successfully" }
}
```

### 2. Store

#### Get Store Details
```http
GET /stores/:storeId
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "id": "store_123",
    "name": "Bella Teh Indonesia",
    "description": "Penjual teh premium organik",
    "email": "store@example.com",
    "phone": "081234567890",
    "address": "Jl. Sukabumi No. 10",
    "city": "Bandung",
    "province": "Jawa Barat",
    "businessType": "food",
    "taxId": "123456789012345",
    "currency": "IDR",
    "taxRate": 12,
    "channels": {
      "whatsapp": {
        "connected": true,
        "number": "081234567890",
        "connectedAt": "2026-02-10T10:00:00Z"
      },
      "telegram": {
        "connected": true,
        "username": "@bella_teh",
        "connectedAt": "2026-02-10T10:05:00Z"
      }
    },
    "metadata": {}
  }
}
```

#### Update Store
```http
PATCH /stores/:storeId
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Premium organic tea seller",
  "taxRate": 12,
  "autoReplyMessage": "Terima kasih! Kami balas dalam 5 menit"
}

Response 200:
{
  "success": true,
  "data": { /* updated store */ }
}
```

---

## COMMERCE ENDPOINTS

### 3. Products

#### List Products
```http
GET /stores/:storeId/products
Authorization: Bearer <token>
Query Parameters:
  - page=1 (default)
  - limit=20 (default, max 100)
  - search=teh (optional)
  - category=beverages (optional)
  - status=active (default: all)
  - sort=created_at (default: -created_at)

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "prod_123",
      "name": "Teh Hijau Organik",
      "description": "Teh hijau premium dari pegunungan",
      "price": 50000,
      "costPrice": 20000,
      "stock": 100,
      "reorderLevel": 20,
      "imageUrl": "https://...",
      "categoryId": "cat_tea",
      "tags": ["teh", "organik", "premium"],
      "status": "active",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-02-10T12:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### Get Product
```http
GET /stores/:storeId/products/:productId
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": { /* product object */ }
}
```

#### Create Product
```http
POST /stores/:storeId/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Teh Putih Premium",
  "description": "White tea from Fujian",
  "price": 75000,
  "costPrice": 30000,
  "stock": 50,
  "reorderLevel": 15,
  "categoryId": "cat_tea",
  "tags": ["white-tea", "premium"]
}

Response 201:
{
  "success": true,
  "data": { /* created product */ }
}
```

#### Update Product
```http
PATCH /stores/:storeId/products/:productId
Authorization: Bearer <token>
Content-Type: application/json

{
  "stock": 45,
  "price": 72000
}

Response 200:
{
  "success": true,
  "data": { /* updated product */ }
}
```

#### Delete Product (Soft Delete)
```http
DELETE /stores/:storeId/products/:productId
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": { "message": "Product archived" }
}
```

### 4. Orders

#### Create Order
```http
POST /stores/:storeId/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "customerId": "cust_123",
  "items": [
    {
      "productId": "prod_123",
      "quantity": 2
    },
    {
      "productId": "prod_456",
      "quantity": 1
    }
  ],
  "shippingAddress": {
    "street": "Jl. Merdeka No. 5",
    "city": "Bandung",
    "province": "Jawa Barat",
    "zipCode": "40123",
    "recipientName": "Ahmad",
    "recipientPhone": "081234567891"
  },
  "shippingMethod": "jne",
  "customerNote": "Jangan lupa teh yang hangat"
}

Response 201:
{
  "success": true,
  "data": {
    "id": "order_789",
    "orderNumber": "ORD-2026-0001",
    "customerId": "cust_123",
    "status": "created",
    "items": [
      {
        "productId": "prod_123",
        "name": "Teh Hijau Organik",
        "quantity": 2,
        "price": 50000,
        "subtotal": 100000
      }
    ],
    "subtotal": 125000,
    "taxAmount": 15000,
    "shippingCost": 20000,
    "totalAmount": 160000,
    "shippingAddress": { /* ... */ },
    "createdAt": "2026-02-10T12:00:00Z"
  }
}
```

#### Get Order
```http
GET /stores/:storeId/orders/:orderId
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": { /* order object with full details */ }
}
```

#### List Orders
```http
GET /stores/:storeId/orders
Authorization: Bearer <token>
Query Parameters:
  - page=1
  - limit=20
  - status=paid (optional: created, paid, shipped, delivered, cancelled)
  - customerId=cust_123 (optional)
  - dateFrom=2026-02-01 (optional)
  - dateTo=2026-02-28 (optional)
  - sort=-created_at (default)

Response 200:
{
  "success": true,
  "data": [
    { /* order objects */ }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

#### Update Order Status
```http
PATCH /stores/:storeId/orders/:orderId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "packed",
  "reason": "Order is ready for shipment",
  "trackingNumber": "JNE-2026-ABC123"
}

Response 200:
{
  "success": true,
  "data": { /* updated order */ }
}
```

---

## PAYMENT ENDPOINTS

### 5. Payments

#### Initiate Payment
```http
POST /stores/:storeId/orders/:orderId/payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "method": "qris",
  "gateway": "xendit"
}

Response 201:
{
  "success": true,
  "data": {
    "id": "pay_123",
    "orderId": "order_789",
    "amount": 160000,
    "currency": "IDR",
    "method": "qris",
    "gateway": "xendit",
    "status": "pending",
    "expiresAt": "2026-02-10T13:00:00Z",
    "paymentUrl": "https://qris.example.com/pay/pay_123",
    "qrisCode": "00020126360014...",
    "createdAt": "2026-02-10T12:00:00Z"
  }
}
```

#### Get Payment Status
```http
GET /stores/:storeId/payments/:paymentId
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "id": "pay_123",
    "status": "confirmed",
    "amount": 160000,
    "confirmedAt": "2026-02-10T12:15:30Z",
    "method": "qris",
    "gateway": "xendit"
  }
}
```

#### List Payments
```http
GET /stores/:storeId/payments
Authorization: Bearer <token>
Query Parameters:
  - page=1
  - limit=20
  - status=confirmed (optional)
  - gateway=xendit (optional)
  - dateFrom=2026-02-01 (optional)
  - dateTo=2026-02-28 (optional)

Response 200:
{
  "success": true,
  "data": [
    { /* payment objects */ }
  ],
  "meta": { /* pagination */ }
}
```

#### Refund Payment
```http
POST /stores/:storeId/payments/:paymentId/refund
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 160000,
  "reason": "customer_request",
  "description": "Customer changed mind"
}

Response 201:
{
  "success": true,
  "data": {
    "id": "refund_123",
    "paymentId": "pay_123",
    "amount": 160000,
    "status": "pending",
    "reason": "customer_request",
    "createdAt": "2026-02-10T12:30:00Z"
  }
}
```

#### Payment Webhook (Xendit/Stripe)
```http
POST /webhooks/payments/xendit
Content-Type: application/json
X-Callback-Token: <signature>

{
  "event": "payment_completed",
  "payment_id": "pay_123",
  "external_id": "xendit_trans_123",
  "amount": 160000,
  "status": "COMPLETED",
  "timestamp": "2026-02-10T12:15:30Z"
}

Response 200:
{
  "success": true,
  "data": { "message": "Webhook processed" }
}
```

---

## INVENTORY ENDPOINTS

### 6. Inventory

#### Get Product Stock
```http
GET /stores/:storeId/products/:productId/stock
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "productId": "prod_123",
    "currentStock": 45,
    "reorderLevel": 20,
    "reserved": 5,
    "available": 40,
    "lastMovement": {
      "type": "outbound",
      "quantity": 2,
      "timestamp": "2026-02-10T12:00:00Z"
    }
  }
}
```

#### List Low Stock Products
```http
GET /stores/:storeId/inventory/low-stock
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "prod_123",
      "name": "Teh Hijau Organik",
      "currentStock": 18,
      "reorderLevel": 20,
      "status": "below_reorder_level"
    }
  ]
}
```

#### Inventory Movement
```http
POST /stores/:storeId/inventory/movements
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "prod_123",
  "type": "inbound",
  "quantity": 50,
  "reason": "Stock replenishment",
  "notes": "From supplier ABC"
}

Response 201:
{
  "success": true,
  "data": {
    "id": "mov_123",
    "productId": "prod_123",
    "type": "inbound",
    "quantity": 50,
    "stockBefore": 18,
    "stockAfter": 68,
    "createdAt": "2026-02-10T12:00:00Z"
  }
}
```

---

## CUSTOMER ENDPOINTS

### 7. Customers

#### Create Customer
```http
POST /stores/:storeId/customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Ahmad Wijaya",
  "phone": "081234567891",
  "email": "ahmad@example.com",
  "address": "Jl. Sudirman No. 10",
  "city": "Bandung",
  "province": "Jawa Barat"
}

Response 201:
{
  "success": true,
  "data": {
    "id": "cust_123",
    "name": "Ahmad Wijaya",
    "phone": "081234567891",
    "email": "ahmad@example.com",
    "segment": "new",
    "totalSpent": 0,
    "orderCount": 0,
    "createdAt": "2026-02-10T12:00:00Z"
  }
}
```

#### Get Customer
```http
GET /stores/:storeId/customers/:customerId
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "id": "cust_123",
    "name": "Ahmad Wijaya",
    "phone": "081234567891",
    "segment": "regular",
    "totalSpent": 450000,
    "orderCount": 3,
    "lastOrderAt": "2026-02-09T15:30:00Z",
    "preferences": {
      "paymentMethod": "qris",
      "language": "id",
      "notifications": true
    },
    "recentOrders": [
      { /* order summaries */ }
    ]
  }
}
```

#### List Customers
```http
GET /stores/:storeId/customers
Authorization: Bearer <token>
Query Parameters:
  - page=1
  - limit=20
  - search=ahmad (optional, searches name/phone/email)
  - segment=regular (optional)
  - sort=-totalSpent (default)

Response 200:
{
  "success": true,
  "data": [
    { /* customer objects */ }
  ],
  "meta": { /* pagination */ }
}
```

#### Update Customer
```http
PATCH /stores/:storeId/customers/:customerId
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "ahmad_new@example.com",
  "preferences": {
    "paymentMethod": "bank_transfer",
    "notifications": false
  }
}

Response 200:
{
  "success": true,
  "data": { /* updated customer */ }
}
```

#### Customer Analytics
```http
GET /stores/:storeId/customers/:customerId/analytics
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "customerId": "cust_123",
    "lifetime_value": 450000,
    "order_count": 3,
    "average_order_value": 150000,
    "last_order_date": "2026-02-09T15:30:00Z",
    "first_order_date": "2026-01-15T10:00:00Z",
    "repeat_customer": true,
    "preferred_products": [
      { "productId": "prod_123", "purchases": 2 }
    ]
  }
}
```

---

## AI AGENT ENDPOINTS

### 8. AI Agent

#### Send Customer Message
```http
POST /stores/:storeId/agent/message
Content-Type: application/json

{
  "customerId": "cust_123",
  "text": "Pesan 2 teh hijau",
  "channel": "whatsapp",
  "channelMessageId": "wamsg_abc123"
}

Response 200:
{
  "success": true,
  "data": {
    "customerId": "cust_123",
    "agentResponse": "Baik! 2x Teh Hijau Organik, harga Rp 50K/pcs jadi Rp 100K. Kamu member setia, dapat diskon 20% jadi Rp 80K. Mau lanjut? Bayar lewat QRIS? 🎫",
    "suggestedActions": [
      {
        "type": "button",
        "label": "Bayar QRIS",
        "action": "initiate_payment",
        "value": { "method": "qris" }
      },
      {
        "type": "button",
        "label": "Bank Transfer",
        "action": "initiate_payment",
        "value": { "method": "bank_transfer" }
      }
    ],
    "createdOrder": {
      "id": "order_789",
      "status": "created",
      "totalAmount": 80000
    },
    "context": {
      "customerHistory": "2 purchases, 5 teh hijau bought before",
      "inventoryStatus": "50 stock available"
    }
  }
}
```

#### Get Message History
```http
GET /stores/:storeId/customers/:customerId/messages
Authorization: Bearer <token>
Query Parameters:
  - limit=50 (default)
  - offset=0 (default)
  - channel=whatsapp (optional)

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "msg_123",
      "text": "Pesan 2 teh hijau",
      "direction": "inbound",
      "channel": "whatsapp",
      "timestamp": "2026-02-10T12:00:00Z"
    },
    {
      "id": "msg_124",
      "text": "Baik! 2x Teh Hijau...",
      "direction": "outbound",
      "channel": "whatsapp",
      "timestamp": "2026-02-10T12:00:05Z"
    }
  ]
}
```

---

## ADMIN ENDPOINTS

### 9. Analytics & Reporting

#### Store Analytics
```http
GET /stores/:storeId/analytics
Authorization: Bearer <token>
Query Parameters:
  - period=month (day, week, month, year)
  - dateFrom=2026-02-01 (optional)
  - dateTo=2026-02-28 (optional)

Response 200:
{
  "success": true,
  "data": {
    "period": "2026-02-01 to 2026-02-10",
    "revenue": {
      "total": 5000000,
      "gross": 5000000,
      "net": 4400000, // after tax
      "change": 12.5 // percent vs previous period
    },
    "orders": {
      "total": 45,
      "average_value": 111111,
      "completed": 40,
      "pending": 5,
      "cancelled": 0
    },
    "payments": {
      "total": 45,
      "successful": 42,
      "failed": 3,
      "success_rate": 93.3
    },
    "customers": {
      "new": 8,
      "returning": 15,
      "total_unique": 23
    },
    "top_products": [
      {
        "id": "prod_123",
        "name": "Teh Hijau Organik",
        "sales": 25,
        "revenue": 1250000
      }
    ]
  }
}
```

#### Tax Report (SPT)
```http
GET /stores/:storeId/tax-report
Authorization: Bearer <token>
Query Parameters:
  - month=2 (1-12)
  - year=2026

Response 200:
{
  "success": true,
  "data": {
    "period": "February 2026",
    "totalRevenue": 5000000,
    "totalTax": 600000,
    "taxRate": 12,
    "transactions": 45,
    "paymentMethods": {
      "qris": 20,
      "bank_transfer": 15,
      "ewallet": 10
    },
    "taxSummary": {
      "gross": 5000000,
      "tax": 600000,
      "net": 4400000
    },
    "status": "ready_to_file",
    "documentUrl": "https://..."
  }
}
```

---

## ERROR HANDLING

### Standard Error Codes

```typescript
enum ErrorCode {
  // Validation (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  
  // Authentication (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Authorization (403)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Not Found (404)
  NOT_FOUND = 'NOT_FOUND',
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  CUSTOMER_NOT_FOUND = 'CUSTOMER_NOT_FOUND',
  PAYMENT_NOT_FOUND = 'PAYMENT_NOT_FOUND',
  
  // Conflict (409)
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  ORDER_ALREADY_PAID = 'ORDER_ALREADY_PAID',
  
  // Payment (402)
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_GATEWAY_ERROR = 'PAYMENT_GATEWAY_ERROR',
  
  // Server (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}
```

### Error Response Example
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Not enough stock for product",
    "status": 400,
    "details": {
      "productId": "prod_123",
      "requested": 50,
      "available": 20
    }
  },
  "meta": {
    "timestamp": "2026-02-10T12:00:00Z",
    "requestId": "req_123abc"
  }
}
```

---

## RATE LIMITING

### Limits by Endpoint Type

```
Public endpoints (auth, webhooks):
  - 10 requests per minute per IP

Authenticated endpoints:
  - 100 requests per minute per user
  - 1000 requests per hour per user

Payment endpoints:
  - 10 requests per minute per store (stricter)

Webhook endpoints:
  - Unlimited (validated by signature)
```

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1644314400
```

### Rate Limit Response (429)
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "status": 429,
    "retryAfter": 60
  }
}
```

---

## WEBHOOKS

### Payment Gateway Webhooks

#### Xendit Webhook
```http
POST /webhooks/payments/xendit
X-Callback-Token: <signature>
Content-Type: application/json

{
  "event": "invoice.paid",
  "external_id": "xendit_inv_123",
  "invoice_id": "xendit_inv_123",
  "amount": 160000,
  "paid_at": "2026-02-10T12:15:30Z"
}
```

#### Stripe Webhook
```http
POST /webhooks/payments/stripe
Stripe-Signature: t=..., v1=...
Content-Type: application/json

{
  "id": "evt_1Gbzxyz",
  "object": "event",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_123",
      "object": "payment_intent",
      "amount": 160000,
      "status": "succeeded"
    }
  }
}
```

#### Webhook Verification
```typescript
// src/api/webhooks/verify.ts
import crypto from 'crypto';

export function verifyXenditSignature(
  payload: string,
  signature: string,
  apiKey: string
): boolean {
  const hash = crypto
    .createHmac('sha256', apiKey)
    .update(payload)
    .digest('hex');
  
  return hash === signature;
}
```

---

## IMPLEMENTATION WITH HONO

### Project Structure

```
src/
├── api/
│   ├── handlers/
│   │   ├── auth.ts
│   │   ├── orders.ts
│   │   ├── payments.ts
│   │   ├── customers.ts
│   │   ├── products.ts
│   │   └── agent.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── rateLimit.ts
│   ├── webhooks/
│   │   ├── xendit.ts
│   │   └── stripe.ts
│   └── routes.ts
├── services/
│   ├── order.service.ts
│   ├── payment.service.ts
│   ├── customer.service.ts
│   ├── product.service.ts
│   └── agent.service.ts
├── db/
│   ├── schema.ts
│   ├── config.ts
│   └── migrations/
└── main.ts
```

### Hono Server Setup

```typescript
// src/main.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { requestId } from 'hono/request-id';
import { authMiddleware } from './api/middleware/auth';
import { errorHandler } from './api/middleware/errorHandler';
import { rateLimiter } from './api/middleware/rateLimit';
import { setupRoutes } from './api/routes';

const app = new Hono();

// Global middleware
app.use(logger());
app.use(requestId());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true,
}));
app.use(rateLimiter);

// Health check
app.get('/health', (c) => {
  return c.json({
    success: true,
    data: { status: 'ok', timestamp: new Date() },
  });
});

// API routes
app.use('/api/*', setupRoutes);

// Error handling
app.use(errorHandler);

export default app;
```

---

## NEXT STEPS

### Day 11 Complete ✅
- [x] API overview and response format
- [x] Authentication (JWT)
- [x] Core endpoints (auth, stores)
- [x] Commerce endpoints (products, orders)
- [x] Payment endpoints
- [x] Inventory endpoints
- [x] Customer endpoints
- [x] AI Agent endpoints
- [x] Admin endpoints
- [x] Error handling & error codes
- [x] Rate limiting strategy
- [x] Webhook specifications

### Day 12-14: Project Setup
- Initialize Hono + TypeScript project
- Set up database with Drizzle ORM
- Implement authentication middleware
- Create base service classes
- Set up Docker + GitHub Actions
- Deploy to staging

---

**Document Status**: Day 11 Complete ✅  
**Next**: Project initialization (Days 12-14)  
**Author**: AI API Design Agent  
**Date**: February 10, 2026
