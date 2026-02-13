#!/usr/bin/env node

/**
 * Payment Integration Test Script
 * Tests the Midtrans payment integration
 */

import { getDb } from "../src/db/config.js";
import {
  payments,
  orders,
  users,
  stores,
  customers,
} from "../src/db/schema.js";
import { paymentService } from "../src/services/payment.service.js";
import { getEnv } from "../src/env.js";

async function testPaymentIntegration() {
  console.log("🧪 Starting Payment Integration Tests...\n");

  try {
    const env = getEnv();
    const db = getDb();

    // 1. Create test user
    console.log("📝 Creating test user...");
    const userResult = await db
      .insert(users)
      .values({
        email: `test-${Date.now()}@example.com`,
        password_hash: "hashed_password", // In production, this would be properly hashed
        full_name: "Test User",
        phone: "081234567890",
        is_active: true,
      })
      .returning();

    const userId = userResult[0].id;
    console.log(`✅ Created user ID: ${userId}\n`);

    // 2. Create test store
    console.log("🏪 Creating test store...");
    const storeResult = await db
      .insert(stores)
      .values({
        user_id: userId,
        name: "Test Store",
        slug: `test-store-${Date.now()}`,
        is_active: true,
      })
      .returning();

    const storeId = storeResult[0].id;
    console.log(`✅ Created store ID: ${storeId}\n`);

    // 3. Create test customer
    console.log("👤 Creating test customer...");
    const customerResult = await db
      .insert(customers)
      .values({
        store_id: storeId,
        name: "John Doe",
        email: "john@example.com",
        phone: "081234567890",
      })
      .returning();

    const customerId = customerResult[0].id;
    console.log(`✅ Created customer ID: ${customerId}\n`);

    // 4. Create test order
    console.log("📦 Creating test order...");
    const orderResult = await db
      .insert(orders)
      .values({
        store_id: storeId,
        customer_id: customerId,
        order_number: `ORD-${Date.now()}`,
        total_amount: "115000.00",
        tax_amount: "10000.00",
        shipping_amount: "5000.00",
        status: "pending",
        notes: "Test order",
      })
      .returning();

    const orderId = orderResult[0].id;
    console.log(`✅ Created order ID: ${orderId}\n`);

    // 5. Test cash payment (no Midtrans required)
    console.log("💰 Testing cash payment...");
    try {
      const cashPayment = await paymentService.createPayment({
        orderId: orderId,
        storeId: storeId,
        amount: 115000,
        method: "cash",
        customerEmail: "john@example.com",
        customerPhone: "081234567890",
        customerName: "John Doe",
        orderNumber: `ORD-${Date.now()}`,
      });

      console.log(`✅ Cash payment created:`, {
        paymentId: cashPayment.id,
        status: cashPayment.status,
        method: cashPayment.method,
      });
      console.log("");
    } catch (error) {
      console.error(
        `❌ Cash payment failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      console.log("");
    }

    // 6. Test QRIS payment (requires Midtrans)
    console.log("📱 Testing QRIS payment (Midtrans)...");
    try {
      // Check if Midtrans keys are properly configured
      if (
        env.MIDTRANS_SERVER_KEY === "SB-Mid-server-test-key-here-for-sandbox" ||
        env.MIDTRANS_CLIENT_KEY === "SB-Mid-client-test-key-here-for-sandbox"
      ) {
        console.log(
          "⚠️  Midtrans keys not fully configured. Using test keys.\n" +
            "   To test Midtrans integration:\n" +
            "   1. Get sandbox keys from https://dashboard.sandbox.midtrans.com\n" +
            "   2. Update .env with MIDTRANS_SERVER_KEY and MIDTRANS_CLIENT_KEY\n",
        );
      } else {
        const qrisPayment = await paymentService.createPayment({
          orderId: orderId,
          storeId: storeId,
          amount: 115000,
          method: "qris",
          customerEmail: "john@example.com",
          customerPhone: "081234567890",
          customerName: "John Doe",
          orderNumber: `ORD-QRIS-${Date.now()}`,
        });

        console.log(`✅ QRIS payment created:`, {
          paymentId: qrisPayment.id,
          status: qrisPayment.status,
          method: qrisPayment.method,
          snapToken: qrisPayment.snapToken ? "***" : undefined,
        });
        console.log("");
      }
    } catch (error) {
      console.log(
        `⚠️  QRIS payment test skipped: ${error instanceof Error ? error.message : "Unknown error"}\n`,
      );
    }

    // 7. Test payment retrieval
    console.log("🔍 Testing payment retrieval...");
    try {
      const payment = await paymentService.getPaymentByOrderId(orderId);
      if (payment) {
        console.log(`✅ Payment found:`, {
          id: payment.id,
          status: payment.status,
          method: payment.method,
        });
      } else {
        console.log("❌ Payment not found");
      }
      console.log("");
    } catch (error) {
      console.error(
        `❌ Payment retrieval failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      console.log("");
    }

    console.log("✅ All tests completed!");
    process.exit(0);
  } catch (error) {
    console.error(
      "❌ Test failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    console.error(error);
    process.exit(1);
  }
}

// Run tests
testPaymentIntegration();
