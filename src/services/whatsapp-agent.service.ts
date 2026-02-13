/**
 * WhatsApp + AI Agent Integration Service
 * Routes WhatsApp messages through AI Agent for intelligent responses
 */

import type { IncomingMessage } from "@/services/whatsapp.service";
import { AgentService } from "@/services/agent.service";
import type { AgentConfig } from "@/lib/agent.types";
import { getDb } from "@/db/config";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getEnv } from "@/env";

export class WhatsAppAgentService {
  private agentService: AgentService;
  private conversationMap: Map<string, string> = new Map(); // phone -> conversationId

  constructor(agentConfig: AgentConfig) {
    this.agentService = new AgentService(agentConfig);
  }

  /**
   * Process incoming WhatsApp message and generate response using AI Agent
   */
  async handleIncomingMessage(
    message: IncomingMessage,
    storeId: number,
  ): Promise<string> {
    try {
      const db = getDb();

      // 1. Find or create customer by phone
      const phoneNumber = message.from;
      let customerResult = await db
        .select()
        .from(customers)
        .where(eq(customers.phone, phoneNumber));

      let customer = customerResult[0];

      if (!customer) {
        // Create new customer if doesn't exist - need a store_id
        // For now, use the storeId passed in (customer should belong to a store)
        const result = await db
          .insert(customers)
          .values({
            store_id: storeId,
            name: `WhatsApp User (${phoneNumber})`,
            phone: phoneNumber,
            email: `whatsapp-${phoneNumber}@store.local`,
          })
          .returning();

        customer = result[0];
      }

      // 2. Get or create conversation ID for this customer
      let conversationId = this.conversationMap.get(phoneNumber);
      if (!conversationId) {
        conversationId = `whatsapp-${phoneNumber}-${Date.now()}`;
        this.conversationMap.set(phoneNumber, conversationId);
      }

      // 3. Send message to agent and get response
      const response = await this.agentService.executeAgentic(
        conversationId,
        customer.id,
        storeId,
        message.text,
      );

      if (!response.success) {
        return (
          response.message ||
          "Maaf, saya tidak bisa memproses permintaan Anda saat ini."
        );
      }

      return response.message ?? "Permintaan telah diproses.";
    } catch (error) {
      console.error("Error processing WhatsApp message:", error);
      return "Terjadi kesalahan. Silakan coba lagi nanti.";
    }
  }

  /**
   * Get conversation history for a customer
   */
  async getConversationHistory(phoneNumber: string) {
    const conversationId = this.conversationMap.get(phoneNumber);
    if (!conversationId) {
      return [];
    }

    return this.agentService.getConversationHistory(conversationId);
  }

  /**
   * Clear conversation for a customer
   */
  async clearConversation(phoneNumber: string) {
    const conversationId = this.conversationMap.get(phoneNumber);
    if (conversationId) {
      await this.agentService.clearConversation(conversationId);
      this.conversationMap.delete(phoneNumber);
    }
  }
}

/**
 * Factory function to create WhatsApp Agent Service with default config
 */
export function createWhatsAppAgentService(): WhatsAppAgentService {
  const agentConfig: AgentConfig = {
    provider: getEnv().ANTHROPIC_API_KEY
      ? "claude"
      : getEnv().GEMINI_API_KEY
        ? "gemini"
        : "claude",
    systemPrompt: `You are a helpful WhatsApp customer service AI for an e-commerce store.
You help customers:
- Browse and inquire about products
- Create orders via WhatsApp
- Check order status
- Answer questions about products

Always respond in a friendly, professional manner in Indonesian (or customer's language).
Keep responses concise and suitable for WhatsApp (short messages).
When customers want to buy, confirm product and quantity before creating order.`,
    tools: [
      {
        name: "create_order",
        description: "Create a new order for customer",
        parameters: {
          type: "object",
          properties: {
            productIds: {
              type: "array",
              description: "Product IDs to order",
            },
            quantities: {
              type: "array",
              description: "Quantities for each product",
            },
          },
          required: ["productIds", "quantities"],
        },
      },
      {
        name: "get_product_info",
        description: "Get details about a product",
        parameters: {
          type: "object",
          properties: {
            product_id: {
              type: "number",
              description: "Product ID",
            },
          },
          required: ["product_id"],
        },
      },
      {
        name: "list_products",
        description: "List available products in store",
        parameters: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "check_order_status",
        description: "Check status of an order",
        parameters: {
          type: "object",
          properties: {
            order_id: {
              type: "number",
              description: "Order ID",
            },
          },
          required: ["order_id"],
        },
      },
    ],
    maxIterations: 3,
    memorySize: 10,
  };

  return new WhatsAppAgentService(agentConfig);
}

export const whatsAppAgentService = createWhatsAppAgentService();
