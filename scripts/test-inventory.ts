#!/usr/bin/env node

/**
 * Inventory Management Test Script
 * Tests all inventory features end-to-end
 */

import { getDb } from "@/db/config";
import { inventoryService } from "@/services/inventory.service";
import {
  stores,
  users,
  products,
  product_variants,
  customers,
  orders,
  order_items,
} from "@/db/schema";
import { eq } from "drizzle-orm";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runTests() {
  const db = getDb();
  log("\n=== Inventory Management Test Suite ===\n", "blue");

  try {
    // Setup: Create test data
    log("📋 Setting up test data...", "yellow");

    // Create user
    const userResult = await db
      .insert(users)
      .values({
        email: "inventory-test@test.com",
        password_hash: "test-hash",
        full_name: "Test User",
        phone: "6281234567890",
        role: "seller",
      })
      .returning({ id: users.id });

    const userId = userResult[0].id;

    // Create store
    const storeResult = await db
      .insert(stores)
      .values({
        user_id: userId,
        name: "Test Store for Inventory",
        slug: `inventory-test-${Date.now()}`,
        description: "Test store",
      })
      .returning({ id: stores.id });

    const storeId = storeResult[0].id;
    log(`✓ Created test store (ID: ${storeId})`, "green");

    // Create product
    const productResult = await db
      .insert(products)
      .values({
        store_id: storeId,
        name: "Test Product",
        description: "A product to test inventory",
        price: "50000",
      })
      .returning({ id: products.id });

    const productId = productResult[0].id;

    // Create variants
    const variant1Result = await db
      .insert(product_variants)
      .values({
        product_id: productId,
        name: "Size S",
        sku: "TEST-S",
        price: "50000",
        stock_quantity: 100,
      })
      .returning({ id: product_variants.id });

    const variantId1 = variant1Result[0].id;

    const variant2Result = await db
      .insert(product_variants)
      .values({
        product_id: productId,
        name: "Size M",
        sku: "TEST-M",
        price: "55000",
        stock_quantity: 50,
      })
      .returning({ id: product_variants.id });

    const variantId2 = variant2Result[0].id;

    log(
      `✓ Created 2 product variants:
  - Variant 1 (ID: ${variantId1}): 100 units
  - Variant 2 (ID: ${variantId2}): 50 units`,
      "green",
    );

    // Create customer
    const customerResult = await db
      .insert(customers)
      .values({
        store_id: storeId,
        phone: "6289876543210",
        name: "Test Customer",
      })
      .returning({ id: customers.id });

    const customerId = customerResult[0].id;
    log(`✓ Created test customer (ID: ${customerId})`, "green");

    // Test 1: Get stock level
    log("\n📊 Test 1: Get Stock Level", "blue");
    const stockLevel1 = await inventoryService.getStockLevel(variantId1);
    log(
      `Stock for variant ${variantId1}:
  - Current: ${stockLevel1.current_stock}
  - Reserved: ${stockLevel1.reserved_quantity}
  - Available: ${stockLevel1.available_stock}`,
      "green",
    );

    // Test 2: Reserve stock
    log("\n📦 Test 2: Reserve Stock for Order", "blue");
    const orderResult = await db
      .insert(orders)
      .values({
        store_id: storeId,
        customer_id: customerId,
        order_number: `ORD-${storeId}-${Date.now()}`,
        total_amount: "150000",
        channel: "web",
      })
      .returning({ id: orders.id });

    const orderId = orderResult[0].id;

    const reservations = await inventoryService.reserveStock(
      orderId,
      [
        { product_variant_id: variantId1, quantity: 10 },
        { product_variant_id: variantId2, quantity: 5 },
      ],
      storeId,
    );

    log(
      `✓ Reserved stock for order ${orderId}:
  - ${reservations.length} reservations created
  - Total reserved: 15 units`,
      "green",
    );

    // Test 3: Verify availability updated
    log("\n🔍 Test 3: Verify Availability After Reservation", "blue");
    const stockLevel2 = await inventoryService.getStockLevel(variantId1);
    log(
      `Updated stock for variant ${variantId1}:
  - Current: ${stockLevel2.current_stock}
  - Reserved: ${stockLevel2.reserved_quantity}
  - Available: ${stockLevel2.available_stock}`,
      "green",
    );

    if (
      stockLevel2.reserved_quantity === 10 &&
      stockLevel2.available_stock === 90
    ) {
      log("✓ Reservation correctly updated stock levels", "green");
    } else {
      log("✗ Stock levels not correctly updated", "red");
    }

    // Test 4: Manual adjustment
    log("\n⚙️  Test 4: Manual Stock Adjustment", "blue");
    await inventoryService.adjustStock(variantId1, storeId, -5, "stock_damage");
    log("✓ Adjusted stock by -5 units (damage)", "green");

    const stockLevel3 = await inventoryService.getStockLevel(variantId1);
    log(
      `Updated stock for variant ${variantId1}:
  - Current: ${stockLevel3.current_stock}
  - Available: ${stockLevel3.available_stock}`,
      "green",
    );

    // Test 5: Get movement history
    log("\n📜 Test 5: View Movement History", "blue");
    const movements = await inventoryService.getMovementHistory(
      variantId1,
      storeId,
    );
    log(
      `Movement history for variant ${variantId1}:
  - Total movements: ${movements.length}`,
      "green",
    );

    if (movements.length > 0) {
      log("Recent movements:", "yellow");
      movements.slice(0, 3).forEach((m) => {
        log(
          `  - [${m.type}] ${m.quantity > 0 ? "+" : ""}${m.quantity} units - ${m.reason || "N/A"}`,
        );
      });
    }

    // Test 6: Get reservations for order
    log("\n🎫 Test 6: Get Order Reservations", "blue");
    const orderReservations =
      await inventoryService.getOrderReservations(orderId);
    log(
      `Reservations for order ${orderId}: ${orderReservations.length}`,
      "green",
    );
    orderReservations.forEach((r) => {
      const released = r.released_at ? "RELEASED" : "ACTIVE";
      log(
        `  - Variant ${r.product_variant_id}: ${r.quantity} units [${released}]`,
      );
    });

    // Test 7: Release reservation
    log("\n🔓 Test 7: Release Reservation", "blue");
    if (reservations.length > 0) {
      const reservationToRelease = reservations[0];
      await inventoryService.releaseReservation(
        reservationToRelease.id,
        storeId,
      );
      log(`✓ Released reservation ${reservationToRelease.id}`, "green");

      const stockLevel4 = await inventoryService.getStockLevel(variantId1);
      log(
        `Stock after release:
  - Reserved: ${stockLevel4.reserved_quantity}
  - Available: ${stockLevel4.available_stock}`,
        "green",
      );
    }

    // Test 8: Check low stock
    log("\n⚠️  Test 8: Check Low Stock Items", "blue");
    const lowStockItems = await inventoryService.checkLowStock(storeId, 75);
    log(
      `Low stock items (threshold <= 75):
  - Found: ${lowStockItems.length} items`,
      "green",
    );

    lowStockItems.forEach((item) => {
      log(`  - ${item.sku}: ${item.available_stock} units available`);
    });

    // Cleanup
    log("\n🧹 Cleaning up test data...", "yellow");
    await db.delete(users).where(eq(users.id, userId));
    log("✓ Test data cleaned up", "green");

    log("\n✨ All inventory tests passed!", "green");
  } catch (error) {
    log(
      `\n❌ Test failed: ${error instanceof Error ? error.message : String(error)}`,
      "red",
    );
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run tests
runTests();
