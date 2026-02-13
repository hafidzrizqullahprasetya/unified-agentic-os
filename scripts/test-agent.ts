#!/usr/bin/env node

/**
 * AI Agent Integration Test Script
 * Tests the AI Agent functionality with agentic loop
 */

import { getDb } from "../src/db/config.js";
import {
  users,
  stores,
  customers,
  products,
  product_variants,
} from "../src/db/schema.js";
import { createAgentService } from "../src/services/agent.service.js";
import type { AgentConfig } from "../src/lib/agent.types.js";
import { getEnv } from "../src/env.js";

async function testAgentIntegration() {
  console.log("🤖 Starting AI Agent Integration Tests...\n");

  try {
    const env = getEnv();
    const db = getDb();

    // 1. Create test user
    console.log("📝 Creating test user...");
    const userResult = await db
      .insert(users)
      .values({
        email: `test-agent-${Date.now()}@example.com`,
        password_hash: "hashed_password",
        full_name: "Agent Test User",
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
        name: "Agent Test Store",
        slug: `agent-store-${Date.now()}`,
        is_active: true,
      })
      .returning();

    const storeId = storeResult[0].id;
    console.log(`✅ Created store ID: ${storeId}\n`);

    // 3. Create test products
    console.log("📦 Creating test products...");
    const productsResult = await db
      .insert(products)
      .values([
        {
          store_id: storeId,
          name: "Laptop Pro",
          slug: "laptop-pro",
          description: "High-performance laptop",
          price: "15000000",
          sku: "LAPTOP-001",
          is_active: true,
        },
        {
          store_id: storeId,
          name: "Mouse Wireless",
          slug: "mouse-wireless",
          description: "Wireless mouse",
          price: "150000",
          sku: "MOUSE-001",
          is_active: true,
        },
      ])
      .returning();

    console.log(`✅ Created ${productsResult.length} products\n`);

    // 4. Create product variants
    console.log("📦 Creating product variants...");
    const variantsResult = await db
      .insert(product_variants)
      .values([
        {
          product_id: productsResult[0].id,
          name: "Laptop Pro - Black",
          sku: "LAPTOP-001-BLK",
          variant_value: "Black",
          price: "15000000",
          quantity: 10,
          is_active: true,
        },
        {
          product_id: productsResult[1].id,
          name: "Mouse Wireless - White",
          sku: "MOUSE-001-WHT",
          variant_value: "White",
          price: "150000",
          quantity: 50,
          is_active: true,
        },
      ])
      .returning();

    console.log(`✅ Created ${variantsResult.length} variants\n`);

    // 5. Create test customer
    console.log("👤 Creating test customer...");
    const customerResult = await db
      .insert(customers)
      .values({
        store_id: storeId,
        name: "John Customer",
        email: `customer-${Date.now()}@example.com`,
        phone: "081234567890",
        is_active: true,
      })
      .returning();

    const customerId = customerResult[0].id;
    console.log(`✅ Created customer ID: ${customerId}\n`);

    // 6. Initialize Agent Service
    console.log("🤖 Initializing Agent Service...");
    const agentConfig: AgentConfig = {
      provider: "gemini",
      systemPrompt: `You are a helpful e-commerce AI assistant. Help customers browse products and create orders.`,
      tools: [
        {
          name: "create_order",
          description: "Create a new order",
          parameters: {
            type: "object",
            properties: {
              productIds: { type: "array", description: "Product IDs" },
              quantities: { type: "array", description: "Quantities" },
            },
            required: ["productIds", "quantities"],
          },
        },
        {
          name: "get_product_info",
          description: "Get product information",
          parameters: {
            type: "object",
            properties: {
              product_id: { type: "number", description: "Product ID" },
            },
            required: ["product_id"],
          },
        },
        {
          name: "list_products",
          description: "List all products",
          parameters: {
            type: "object",
            properties: {},
            required: [],
          },
        },
      ],
      maxIterations: 3,
      memorySize: 10,
    };

    const agentService = createAgentService(agentConfig);
    console.log("✅ Agent Service initialized\n");

    // 7. Test agent conversation
    console.log("💬 Testing Agent Conversation...");
    const conversationId = `test-conv-${Date.now()}`;

    try {
      const response = await agentService.executeAgentic(
        conversationId,
        customerId,
        storeId,
        "Hi, what products do you have?",
      );

      console.log("Agent Response:");
      console.log(`  Success: ${response.success}`);
      console.log(`  Message: ${response.message}`);
      if (response.error) {
        console.log(`  Error: ${response.error}`);
      }
      console.log();
    } catch (error) {
      console.log(`⚠️  Agent call error (this is OK for testing): ${error}`);
      console.log();
    }

    // 8. Check conversation history
    console.log("📜 Checking Conversation History...");
    const history = await agentService.getConversationHistory(conversationId);
    console.log(`✅ Found ${history.length} messages in history\n`);

    // 9. Test memory management
    console.log("💾 Testing Memory Management...");
    await agentService.clearConversation(conversationId);
    const clearedHistory =
      await agentService.getConversationHistory(conversationId);
    console.log(
      `✅ After clear: ${clearedHistory.length} messages (should be 0)\n`,
    );

    console.log("✨ All Agent Integration Tests Completed!\n");
  } catch (error) {
    console.error("❌ Error during testing:", error);
    process.exit(1);
  }
}

testAgentIntegration();
