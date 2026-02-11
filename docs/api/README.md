# API Documentation

Complete REST API reference for Unified-Agentic-OS

---

## 📚 Files in This Directory

### 1. **API-ENDPOINTS.md**
Comprehensive REST API specification (1,250+ lines)

**Contains**:
- 50+ REST endpoints fully specified
- Request/response examples for every endpoint
- 25+ standardized error codes
- Rate limiting strategy (100 req/min per user)
- Webhook signature verification (Xendit, Stripe)
- JWT authentication with refresh tokens
- Pagination and filtering examples

**Reading time**: 45 minutes  
**Key for**: API integration and endpoint reference

### 2. **DATABASE-SCHEMA.md**
Complete database schema documentation (1,100+ lines)

**Contains**:
- 17 core tables with Drizzle ORM syntax
- All relationships and foreign keys
- 40+ performance indexes
- Column descriptions and constraints
- Migration strategy
- Seed data for development
- Type definitions

**Reading time**: 30 minutes  
**Key for**: Database understanding and migrations

---

## 🌐 API Overview

### Base URL
```
Development:  http://localhost:3000
Production:   https://api.unified-agentic-os.example.com (TBD)
```

### Authentication
All endpoints (except `/health` and `/auth/*`) require JWT token:

```
Authorization: Bearer <jwt_token>
```

### Response Format
```json
{
  "success": true,
  "data": { /* resource data */ },
  "pagination": { "limit": 50, "offset": 0 }
}
```

### Error Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "context": { /* additional info */ }
  }
}
```

---

## 📋 Endpoint Categories

### Authentication (2 endpoints)
```
POST   /auth/register         - Create new account
POST   /auth/login            - Authenticate user
```

### Stores (6 endpoints)
```
POST   /api/stores                    - Create store
GET    /api/stores                    - List user's stores
GET    /api/stores/:storeId           - Get store details
GET    /api/stores/slug/:slug         - Get by slug
PUT    /api/stores/:storeId           - Update store
DELETE /api/stores/:storeId           - Delete store
```

### Products (6 endpoints)
```
POST   /api/stores/:storeId/products              - Create product
GET    /api/stores/:storeId/products              - List products
GET    /api/stores/:storeId/products/:productId   - Get product
PUT    /api/stores/:storeId/products/:productId   - Update product
DELETE /api/stores/:storeId/products/:productId   - Delete product
GET    /api/stores/:storeId/products/search       - Search products
```

### Customers (5 endpoints)
```
POST   /api/stores/:storeId/customers              - Create customer
GET    /api/stores/:storeId/customers              - List customers
GET    /api/stores/:storeId/customers/:customerId  - Get customer
PUT    /api/stores/:storeId/customers/:customerId  - Update customer
DELETE /api/stores/:storeId/customers/:customerId  - Delete customer
```

### Orders (5 endpoints)
```
POST   /api/stores/:storeId/orders                   - Create order
GET    /api/stores/:storeId/orders                   - List orders
GET    /api/stores/:storeId/orders/:orderId          - Get order
PUT    /api/stores/:storeId/orders/:orderId/status   - Update status
POST   /api/stores/:storeId/orders/:orderId/cancel   - Cancel order
```

### Health (1 endpoint)
```
GET    /health                 - Server health check
```

**Total**: 24 endpoints + health check

---

## 🔑 Key Features

### Authentication
- JWT token-based (HS256)
- Token expiry: 24 hours
- Password hashing: bcryptjs (12 salt rounds)
- Refresh token support

### Authorization
- Role-based access control (admin, seller, customer)
- Ownership verification on all resources
- Seller can only access own stores/products

### Validation
- Zod schema validation on all inputs
- Type-safe request/response
- Clear validation error messages

### Pagination
```
?limit=50&offset=0
```

### Error Handling
- 30+ standardized error codes
- Proper HTTP status codes
- Structured error responses
- Error context for debugging

### Rate Limiting
- 100 requests per minute per user
- Rate limit headers in responses
- 429 status code when exceeded

---

## 📊 Database Tables

### Core Tables
- **users**: User accounts (email, password_hash, role)
- **stores**: Seller stores (name, slug, location)
- **products**: Product catalog (price, stock, SKU)
- **product_variants**: Product variants (size, color)
- **customers**: Customer data (phone, email, address)

### Commerce Tables
- **orders**: Order records (status, total, items count)
- **order_items**: Line items (product, quantity, price)
- **order_status_history**: Status change audit trail

### Payment Tables
- **payments**: Payment records (method, status, amount)
- **payment_methods**: Saved payment methods
- **payment_webhook_logs**: Webhook processing logs

### Inventory Tables
- **inventory_reservations**: Reserved stock for orders
- **inventory_movements**: Stock history (in/out/adjustment)

### Audit Tables
- **customer_messages**: Message history
- **event_audit_log**: System event audit trail

---

## 🔗 Quick Links

| Topic | Document | Time |
|-------|----------|------|
| Full Endpoint Spec | [API-ENDPOINTS.md](./API-ENDPOINTS.md) | 45 min |
| Database Schema | [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md) | 30 min |
| Architecture | [../guides/ARCHITECTURE.md](../guides/ARCHITECTURE.md) | 30 min |
| Setup Guide | [../phase2/PHASE-2-SETUP.md](../phase2/PHASE-2-SETUP.md) | 45 min |

---

## 🛠️ Testing the API

### With cURL
```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "full_name": "User Name"
  }'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Create Store (with token)
curl -X POST http://localhost:3000/api/stores \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Store",
    "description": "My awesome store"
  }'
```

### With Postman
1. Import the API collection (coming soon)
2. Set environment variables (base_url, token)
3. Run requests with pre-filled auth

### With REST Client (VS Code)
Create `.rest` files with request definitions

---

## 📈 API Status Codes

| Code | Meaning | Common Use |
|------|---------|-----------|
| 200 | OK | Successful GET/PUT |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Permission denied |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal error |

---

## 🔐 Security

### Authentication Flow
1. User registers with email/password
2. System hashes password with bcryptjs
3. User logs in, receives JWT token
4. Token included in Authorization header
5. Server verifies token before processing request

### Permission Model
- User owns their stores
- Seller can only access/modify own stores
- Customer can view products from any store
- Admin can access any store (future)

---

## 📞 Support

For API issues:
1. Check [API-ENDPOINTS.md](./API-ENDPOINTS.md) for endpoint details
2. Check [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md) for data models
3. Review error code in response
4. Check request format matches documentation

---

**Last Updated**: February 11, 2026  
**API Version**: v1.0.0 (MVP)  
**Status**: 24 endpoints fully functional ✅
