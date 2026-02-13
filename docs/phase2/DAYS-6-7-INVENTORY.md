# Days 6-7: Inventory Management System

**Objective**: Implement complete inventory tracking, reservation, and movement system

**Duration**: 2 days  
**Status**: 📅 Pending

---

## 📋 Overview

Inventory management is critical for retail & service businesses. We'll build:

1. **Stock Reservation** - Reserve inventory when orders are placed
2. **Inventory Tracking** - Track stock levels by product variant
3. **Movement History** - Log all inventory changes with reasons
4. **Low Stock Alerts** - Notify when stock is running low
5. **Inventory Adjustment** - Manual adjustments for stock counts

---

## 🏗️ Architecture

### Database Schema (Already Created)

```sql
-- Inventory Reservations (from orders)
inventory_reservations (
  id, store_id, product_variant_id, order_id,
  reserved_quantity, status, created_at
)

-- Inventory Movements (tracking all changes)
inventory_movements (
  id, store_id, product_variant_id, movement_type,
  quantity_change, reason, reference_type, reference_id,
  notes, created_by, created_at
)
```

### Service Layer

```
InventoryService
├── getStockLevel(variantId)           # Current stock
├── reserveStock(orderId, items)       # Reserve for order
├── releaseReservation(reservationId)  # Cancel reservation
├── addStock(variantId, qty, reason)   # Manual adjustment
├── getMovementHistory(variantId)      # View history
├── checkLowStock()                    # Alert system
└── getReservations(orderId)           # Order stock status
```

### API Endpoints (4-5 new endpoints)

```
GET  /api/stores/:storeId/inventory/products/:variantId
     └─ Get current stock level & reservations

POST /api/stores/:storeId/inventory/reserve
     └─ Reserve stock for order (called after payment)

POST /api/stores/:storeId/inventory/adjust
     └─ Manual stock adjustment (admin only)

GET  /api/stores/:storeId/inventory/movements
     └─ View inventory movement history

POST /api/stores/:storeId/inventory/release/:reservationId
     └─ Cancel/release reservation
```

---

## 📝 Implementation Checklist

### Day 6: Core Service & Database

- [ ] Create `InventoryService` class
  - [ ] `getStockLevel()` - Query current stock
  - [ ] `getReservations()` - Get order reservations
  - [ ] `addMovement()` - Log movement
  - [ ] Helper for stock calculation

- [ ] Enhance `OrderService`
  - [ ] Call `reserveStock()` after payment
  - [ ] Call `releaseReservation()` on cancel
  - [ ] Validate stock availability

- [ ] Create inventory API handlers
  - [ ] `GET /inventory/:variantId` - Stock level
  - [ ] `GET /inventory/movements` - History
  - [ ] Basic response structure

**Expected Output**:

- Inventory service with core methods
- Basic API endpoints working
- Tests for stock calculations

### Day 7: API Endpoints & Validation

- [ ] Implement `POST /reserve` endpoint
  - [ ] Validate variant exists
  - [ ] Check stock availability
  - [ ] Create reservations
  - [ ] Return success/failure

- [ ] Implement `POST /adjust` endpoint
  - [ ] Admin-only validation
  - [ ] Quantity validation
  - [ ] Reason tracking
  - [ ] Movement logging

- [ ] Implement `POST /release` endpoint
  - [ ] Find reservation
  - [ ] Check status
  - [ ] Release stock
  - [ ] Update order status

- [ ] Add error codes
  - [ ] INSUFFICIENT_STOCK (already exists)
  - [ ] RESERVATION_FAILED (already exists)
  - [ ] INVENTORY_NOT_FOUND
  - [ ] VARIANT_NOT_FOUND

- [ ] Create test script
  - [ ] Reserve stock for order
  - [ ] Adjust inventory
  - [ ] View movements

**Expected Output**:

- All 5 inventory endpoints working
- Proper error handling
- Complete test script

---

## 🔄 Integration Points

### With OrderService

When order is placed:

```typescript
1. Payment is confirmed
2. Call inventoryService.reserveStock(orderId, items)
3. Create order with status = "pending"
4. If reservation fails, reject order
```

When order is cancelled:

```typescript
1. Get order reservations
2. Call inventoryService.releaseReservation()
3. Update inventory movements
4. Set order status = "cancelled"
```

### With ProductService

When creating products:

```typescript
1. Product can have multiple variants
2. Each variant can have stock level
3. Stock is tracked per variant
```

---

## 💾 Sample Data

```typescript
// Product with variants
{
  productId: 1,
  variants: [
    { variantId: 101, sku: "SHM-S", stock: 50 },
    { variantId: 102, sku: "SHM-M", stock: 30 },
  ]
}

// Reservation (when order placed)
{
  reservationId: 201,
  orderId: 1,
  variantId: 101,
  reservedQty: 2,
  status: "reserved",
  expiresAt: "2026-02-14T12:00:00Z"
}

// Movement (inventory change log)
{
  movementId: 301,
  variantId: 101,
  type: "adjustment",
  quantity: -2,
  reason: "stock_opname",
  referenceId: 1,
  notes: "Physical count mismatch"
}
```

---

## 📊 Database Queries

### Stock Level Calculation

```sql
SELECT
  pv.id,
  pv.sku,
  COALESCE(pv.stock, 0) as current_stock,
  COALESCE(SUM(CASE WHEN ir.status = 'reserved'
    THEN ir.reserved_quantity ELSE 0 END), 0) as reserved,
  COALESCE(pv.stock, 0) - COALESCE(SUM(CASE WHEN ir.status = 'reserved'
    THEN ir.reserved_quantity ELSE 0 END), 0) as available_stock
FROM product_variants pv
LEFT JOIN inventory_reservations ir ON pv.id = ir.product_variant_id
WHERE pv.id = $1
GROUP BY pv.id;
```

### Movement History

```sql
SELECT
  im.id,
  im.movement_type,
  im.quantity_change,
  im.reason,
  im.reference_type,
  im.notes,
  u.full_name as created_by,
  im.created_at
FROM inventory_movements im
LEFT JOIN users u ON im.created_by = u.id
WHERE im.product_variant_id = $1
  AND im.store_id = $2
ORDER BY im.created_at DESC
LIMIT 50;
```

---

## ✅ Validation Rules

### Stock Reservation

```typescript
if (requestedQty > availableStock) {
  throw new InventoryError(
    ErrorCode.INSUFFICIENT_STOCK,
    `Only ${availableStock} available`,
  );
}

if (variantNotFound) {
  throw new NotFoundError("Product Variant");
}
```

### Manual Adjustment

```typescript
// Only admin can adjust
if (user.role !== "admin") {
  throw new ForbiddenError();
}

// Reason is required
if (!adjustment.reason) {
  throw new ValidationError("Reason is required");
}

// Quantity must be valid
if (adjustment.quantity === 0) {
  throw new ValidationError("Quantity cannot be zero");
}
```

---

## 🧪 Test Script

```bash
npx tsx scripts/test-inventory.ts
```

**Tests**:

1. Get stock level for variant
2. Reserve stock for order
3. Verify availability updated
4. Manual adjustment
5. View movement history
6. Release reservation
7. Verify stock restored

---

## 📈 Expected Code Structure

```
src/
├── services/
│   └── inventory.service.ts          # NEW
│       ├── getStockLevel()
│       ├── reserveStock()
│       ├── releaseReservation()
│       ├── addMovement()
│       └── getMovementHistory()
├── api/handlers/
│   └── inventory.ts                  # NEW
│       ├── getInventory()
│       ├── reserveStock()
│       ├── adjustInventory()
│       ├── releaseReservation()
│       └── getMovements()
└── lib/
    └── errors.ts                     # Update with inventory errors
```

---

## 🔗 Related Files to Update

1. **src/main.ts** - Add inventory routes
2. **src/db/schema.ts** - Already has tables
3. **src/lib/errors.ts** - Add inventory error codes
4. **src/services/order.service.ts** - Integrate with reservations
5. **package.json** - No new dependencies needed

---

## 📝 Success Criteria

✅ **Day 6 End**:

- Inventory service created
- Core methods implemented
- Basic tests passing
- Stock calculation working

✅ **Day 7 End**:

- All 5 API endpoints working
- Proper error handling
- Full test coverage
- Integrated with OrderService
- 0 TypeScript errors

---

## 🚀 Next: Days 8-9 (Testing & Docker)

After inventory is complete:

- Write comprehensive tests
- Create Docker container
- Setup CI/CD pipeline
- Document deployment

---

**Ready to implement?** 🚀

Start with Day 6 by creating the InventoryService class and database queries.
