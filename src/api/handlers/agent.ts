/**
 * AI Agent API Handlers
 * HTTP endpoints for agent interaction
 */

import { Context } from "hono";
import { createAgentService } from "@/services/agent.service";
import type { AgentConfig } from "@/lib/agent.types";
import { ValidationError } from "@/lib/errors";
import { getEnv } from "@/env";

// Initialize agent service with default config
const agentConfig: AgentConfig = {
  provider: "claude",
  systemPrompt: `You are a helpful AI assistant for an e-commerce store. 
You help customers:
- Browse products and get information
- Create orders
- Check order status
- Answer questions about products and services

Always be polite, professional, and try to help customers complete their purchases.
When customers want to buy something, ask clarifying questions before creating orders.`,
  tools: [
    {
      name: "create_order",
      description: "Create a new order for the customer",
      parameters: {
        type: "object",
        properties: {
          productIds: {
            type: "array",
            description: "Array of product IDs to order",
          },
          quantities: {
            type: "array",
            description: "Array of quantities for each product",
          },
          paymentMethod: {
            type: "string",
            enum: ["cash", "bank_transfer", "card", "ewallet"],
            description: "Payment method for the order",
          },
        },
        required: ["productIds", "quantities"],
      },
    },
    {
      name: "get_product_info",
      description: "Get detailed information about a product",
      parameters: {
        type: "object",
        properties: {
          product_id: {
            type: "number",
            description: "ID of the product",
          },
        },
        required: ["product_id"],
      },
    },
    {
      name: "check_order_status",
      description: "Check the status of an existing order",
      parameters: {
        type: "object",
        properties: {
          order_id: {
            type: "number",
            description: "ID of the order",
          },
        },
        required: ["order_id"],
      },
    },
    {
      name: "list_products",
      description: "List available products in the store",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  ],
  maxIterations: 5,
  memorySize: 10,
};

const agentService = createAgentService(agentConfig);

/**
 * POST /api/agent/chat
 * Chat with the AI agent
 */
export async function agentChat(c: Context) {
  try {
    const body = await c.req.json();
    const { conversationId, customerId, storeId, message } = body;

    if (!conversationId || !customerId || !storeId || !message) {
      throw new ValidationError(
        "Missing required fields: conversationId, customerId, storeId, message",
      );
    }

    const response = await agentService.executeAgentic(
      conversationId,
      customerId,
      storeId,
      message,
    );

    return c.json(response, response.success ? 200 : 400);
  } catch (error) {
    if (error instanceof (await import("@/lib/errors")).AppError) {
      throw error;
    }
    throw new ValidationError("Failed to process agent request");
  }
}

/**
 * GET /api/agent/history/:conversationId
 * Get conversation history
 */
export async function getConversationHistory(c: Context) {
  try {
    const conversationId = c.req.param("conversationId");

    if (!conversationId) {
      throw new ValidationError("conversationId is required");
    }

    const history = await agentService.getConversationHistory(conversationId);

    return c.json({
      success: true,
      conversationId,
      messages: history,
    });
  } catch (error) {
    if (error instanceof (await import("@/lib/errors")).AppError) {
      throw error;
    }
    throw new ValidationError("Failed to fetch conversation history");
  }
}

/**
 * DELETE /api/agent/conversation/:conversationId
 * Clear conversation memory
 */
export async function clearConversation(c: Context) {
  try {
    const conversationId = c.req.param("conversationId");

    if (!conversationId) {
      throw new ValidationError("conversationId is required");
    }

    await agentService.clearConversation(conversationId);

    return c.json({
      success: true,
      message: "Conversation cleared",
    });
  } catch (error) {
    if (error instanceof (await import("@/lib/errors")).AppError) {
      throw error;
    }
    throw new ValidationError("Failed to clear conversation");
  }
}
