# Architecture & Implementation Guides

Detailed guides for understanding and implementing the system.

---

## 📚 Files in This Directory

### 1. **ARCHITECTURE.md**
Complete system architecture documentation (1,200+ lines)

**Contains**:
- System components and data flows
- Architecture diagrams (ASCII)
- Technology stack justification
- Design patterns and principles
- Scalability considerations
- Deployment architecture
- Infrastructure requirements

**Reading time**: 60 minutes  
**Key for**: Understanding system design

### 2. **IMPLEMENTATION-NOTES.md**
Detailed code examples and implementation guidance (1,200+ lines)

**Contains**:
- Code examples from OpenClaw analysis
- Commerce-specific adaptations
- Architecture integration diagrams
- 4-phase implementation strategy
- Pattern implementation details
- Best practices and gotchas

**Reading time**: 90 minutes  
**Key for**: Implementation decisions and code patterns

---

## 🏗️ System Architecture

### High-Level Components

```
Clients (Web, Mobile, Chat)
           ↓
    Hono HTTP Server
           ↓
    Middleware Layer (Auth, Error Handling)
           ↓
    Services Layer (Business Logic)
           ↓
    Drizzle ORM (Type-Safe Queries)
           ↓
    PostgreSQL Database
```

### Detailed Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for:
- Complete component breakdown
- Data flow diagrams
- Technology choices and rationale
- Scalability patterns
- Deployment strategies

---

## 💡 Key Design Principles

### 1. Type Safety First
- 100% TypeScript with strict mode
- No `any` types allowed
- Zod validation for runtime safety
- Type-safe database queries with Drizzle ORM

### 2. Separation of Concerns
```
API Handlers
    ↓ (validate & delegate)
Services (business logic)
    ↓ (orchestrate operations)
Drizzle ORM (database access)
    ↓ (type-safe queries)
PostgreSQL
```

### 3. Security by Default
- JWT authentication on all protected routes
- Password hashing with bcryptjs
- Ownership verification on all resources
- Zod validation on all inputs
- Structured error handling

### 4. Scalability Ready
- Stateless services (can be scaled horizontally)
- Database-agnostic ORM (can migrate easily)
- Event-driven architecture (for async processing)
- Caching-ready endpoints (can add Redis)

---

## 📋 Implementation Phases

### Phase 1: Foundation ✅
- Project setup with TypeScript
- Database schema design
- Authentication system
- Core services
- API endpoints

### Phase 2: Integration (Current)
- Payment gateway integration
- Channel adapters (WhatsApp, Telegram)
- Webhook processing
- Advanced features (inventory, workflows)

### Phase 3: Optimization
- Performance tuning
- Caching strategy
- Load testing
- Security hardening

See [IMPLEMENTATION-NOTES.md](./IMPLEMENTATION-NOTES.md) for detailed implementation strategy.

---

## 🔄 Data Flow Example

### Creating an Order

```
1. Client POST /api/stores/:storeId/orders
                    ↓
2. Hono route handler validates request with Zod
                    ↓
3. Auth middleware verifies JWT token
                    ↓
4. Handler calls orderService.createOrder()
                    ↓
5. Service validates business logic:
   - Store exists
   - Customer belongs to store
   - Products exist in store
   - Stock available
                    ↓
6. Service calculates totals and creates order with items
                    ↓
7. Drizzle ORM executes type-safe SQL queries:
   - INSERT into orders
   - INSERT into order_items
   - INSERT into order_status_history
                    ↓
8. Database operations complete atomically
                    ↓
9. Service returns complete order object
                    ↓
10. Handler formats response with HTTP 201
                    ↓
11. Client receives { success: true, data: order }
```

---

## 🛠️ Development Workflow

### Adding a New Feature

1. **Define Schema** (Zod validation)
   ```typescript
   export const createProductSchema = z.object({
     name: z.string().min(2),
     price: z.number().positive(),
     // ...
   });
   ```

2. **Add Database Table** (if needed)
   - Add to `src/db/schema.ts`
   - Generate migration: `npm run db:generate`
   - Apply migration: `npm run db:push`

3. **Create Service** (business logic)
   ```typescript
   export class ProductService {
     async createProduct(data) {
       // Validation, authorization, database operations
     }
   }
   ```

4. **Add API Endpoint** (HTTP handler)
   ```typescript
   app.post('/api/products', async (c) => {
     const data = createProductSchema.parse(await c.req.json());
     const product = await productService.createProduct(data);
     return c.json({ success: true, data: product }, 201);
   });
   ```

5. **Write Tests**
   - Unit test the service
   - Integration test the endpoint

6. **Commit to Git**
   ```bash
   git add .
   git commit -m "feat: Add product creation feature"
   git push origin main
   ```

---

## 🔐 Security Patterns

### Ownership Verification
```typescript
async getProduct(storeId: number, productId: number) {
  const product = await db.select().from(products)
    .where(eq(products.id, productId));
  
  // Verify ownership
  if (product.store_id !== storeId) {
    throw new ForbiddenError('Access denied');
  }
  
  return product;
}
```

### Input Validation
```typescript
const data = createProductSchema.parse(input);
// If validation fails, throws ValidationError
// Type is now guaranteed to be correct
```

### Error Handling
```typescript
try {
  await operation();
} catch (error) {
  if (error instanceof AppError) {
    return c.json({ error: error.toJSON() }, error.statusCode);
  }
  // Unexpected errors are logged but not exposed
  return c.json({ error: { code: 'INTERNAL_ERROR' } }, 500);
}
```

---

## 📚 Quick Reference

### Files Organization
- `src/api/handlers/*` - HTTP endpoint handlers
- `src/api/middleware/*` - Express-like middleware
- `src/services/*` - Business logic
- `src/db/schema.ts` - Database schema
- `src/lib/*` - Utilities (errors, JWT, validation)

### Common Patterns

**Creating a Service**:
```typescript
export class MyService {
  async operation() { /* ... */ }
}

export function createMyService() {
  return new MyService();
}
```

**Creating an Endpoint**:
```typescript
app.post('/api/resource', authMiddleware, async (c) => {
  const data = createSchema.parse(await c.req.json());
  const result = await service.create(data);
  return c.json({ success: true, data: result }, 201);
});
```

**Error Handling**:
```typescript
if (!resource) {
  throw new NotFoundError('Resource', id);
}
```

---

## 🔗 Related Documentation

| Topic | File | Time |
|-------|------|------|
| System Architecture | [ARCHITECTURE.md](./ARCHITECTURE.md) | 60 min |
| Implementation Details | [IMPLEMENTATION-NOTES.md](./IMPLEMENTATION-NOTES.md) | 90 min |
| API Reference | [../api/API-ENDPOINTS.md](../api/API-ENDPOINTS.md) | 45 min |
| Database Schema | [../api/DATABASE-SCHEMA.md](../api/DATABASE-SCHEMA.md) | 30 min |

---

## 💬 Common Questions

**Q: Why Drizzle ORM?**  
A: Type-safe queries, excellent TypeScript support, migrations, doesn't hide SQL.

**Q: Why Hono?**  
A: Lightweight, fast, excellent TypeScript support, runs everywhere (Node, Workers, Bun).

**Q: Why Zod?**  
A: Runtime validation, type inference, excellent error messages, integrates with everything.

**Q: How to add a new role?**  
A: Update `userRoleEnum` in schema, add role-specific permissions in handlers/services.

**Q: How to add a new payment method?**  
A: Update `paymentMethodEnum` in schema, implement payment service, add webhook handler.

---

**Last Updated**: February 11, 2026  
**Architecture Version**: 1.0.0  
**Status**: Foundation Complete, Ready for Integration Phase
