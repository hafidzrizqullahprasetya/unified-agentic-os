/**
 * AI Agent Service
 * Core agent implementation with agentic loop (think, act, observe)
 */

import { generateText } from "ai";
import type {
  AgentConfig,
  AgentMessage,
  AgentMemory,
  AgentResponse,
  AgentToolCall,
  ToolExecutionResult,
} from "@/lib/agent.types";
import { LLMProviderFactory } from "@/lib/llm-provider";
import { getDb } from "@/db/config";
import { orders, products } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createOrderService } from "@/services/order.service";

export class AgentService {
  private config: AgentConfig;
  private memory: Map<string, AgentMemory> = new Map();
  private orderService = createOrderService();

  constructor(config: AgentConfig) {
    this.config = config;
  }

  /**
   * Main agentic loop: Think -> Act -> Observe -> Repeat
   */
  async executeAgentic(
    conversationId: string,
    customerId: number,
    storeId: number,
    userMessage: string,
    maxIterations: number = this.config.maxIterations || 5,
  ): Promise<AgentResponse> {
    try {
      const memory = await this.getOrCreateMemory(
        conversationId,
        customerId,
        storeId,
      );

      memory.messages.push({
        role: "user",
        content: userMessage,
      });

      let iterations = 0;
      let lastResponse: AgentResponse | null = null;

      while (iterations < maxIterations) {
        iterations++;

        const thinkResult = await this.think(memory);

        if (!thinkResult.success) {
          return thinkResult;
        }

        memory.messages.push({
          role: "assistant",
          content: thinkResult.message,
          toolCalls: thinkResult.toolCalls,
        });

        if (!thinkResult.toolCalls || thinkResult.toolCalls.length === 0) {
          await this.saveMemory(memory);
          return thinkResult;
        }

        const toolResults = await this.act(
          thinkResult.toolCalls,
          customerId,
          storeId,
        );

        const observeMessage: AgentMessage = {
          role: "user",
          content: `Tool results: ${JSON.stringify(toolResults)}`,
          toolResults: toolResults.map((result) => ({
            toolUseId: result.toolName,
            content: JSON.stringify(result),
          })),
        };

        memory.messages.push(observeMessage);
        memory.context.messageCount++;

        lastResponse = thinkResult;
      }

      await this.saveMemory(memory);

      return (
        lastResponse || {
          success: true,
          message: "Agent completed execution",
        }
      );
    } catch (error) {
      console.error("Agent execution error:", error);
      throw error;
    }
  }

  /**
   * THINK: Generate response from LLM
   */
  private async think(memory: AgentMemory): Promise<AgentResponse> {
    try {
      const llmProvider = LLMProviderFactory.createProvider(
        this.config.provider,
      );

      const messages = memory.messages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

      const toolsDescription = this.config.tools
        .map(
          (t) =>
            `- ${t.name}: ${t.description}\n  Params: ${JSON.stringify(t.parameters.required)}`,
        )
        .join("\n");

      const systemPromptWithTools = `${this.config.systemPrompt}

Available tools:
${toolsDescription}

When you need to perform an action, respond with:
TOOL_CALL: {"name": "tool_name", "input": {...}}`;

      const result = await generateText({
        model: llmProvider,
        system: systemPromptWithTools,
        messages,
        temperature: 0.7,
      });

      const toolCalls: AgentToolCall[] = [];
      const toolCallRegex = /TOOL_CALL:\s*(\{[^}]*\})/g;
      let match;

      while ((match = toolCallRegex.exec(result.text)) !== null) {
        try {
          const toolCall = JSON.parse(match[1]);
          toolCalls.push({
            id: `${Date.now()}-${Math.random()}`,
            type: "tool_use",
            name: toolCall.name,
            input: toolCall.input,
          });
        } catch (e) {
          console.error("Failed to parse tool call:", match[1]);
        }
      }

      return {
        success: true,
        message: result.text,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        metadata: {
          tokensUsed: result.usage?.totalTokens,
          provider: this.config.provider,
        },
      };
    } catch (error) {
      console.error("Think phase error:", error);
      return {
        success: false,
        message: `Agent thinking failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * ACT: Execute tool calls
   */
  private async act(
    toolCalls: AgentToolCall[],
    customerId: number,
    storeId: number,
  ): Promise<ToolExecutionResult[]> {
    const results: ToolExecutionResult[] = [];

    for (const toolCall of toolCalls) {
      try {
        let result: any;

        switch (toolCall.name) {
          case "create_order":
            result = await this.toolCreateOrder(
              toolCall.input,
              customerId,
              storeId,
            );
            break;

          case "get_product_info":
            result = await this.toolGetProductInfo(toolCall.input, storeId);
            break;

          case "check_order_status":
            result = await this.toolCheckOrderStatus(toolCall.input);
            break;

          case "list_products":
            result = await this.toolListProducts(storeId);
            break;

          default:
            result = { error: `Unknown tool: ${toolCall.name}` };
        }

        results.push({
          toolName: toolCall.name,
          success: !result.error,
          result,
        });
      } catch (error) {
        results.push({
          toolName: toolCall.name,
          success: false,
          result: null,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }

  /**
   * Tool implementations
   */

  private async toolCreateOrder(
    input: Record<string, any>,
    customerId: number,
    storeId: number,
  ): Promise<any> {
    try {
      const productIds = input.productIds || [];
      const quantities = input.quantities || [];
      const variantIds = input.variantIds || [];

      const items: Array<{
        product_id: number;
        product_variant_id?: number;
        quantity: number;
      }> = productIds.map((id: number, idx: number) => ({
        product_id: id,
        product_variant_id: variantIds[idx],
        quantity: quantities[idx] || 1,
      }));

      const order = await this.orderService.createOrder(storeId, customerId, {
        customer_id: customerId,
        items,
        channel: "api",
      });

      return {
        success: true,
        orderId: order.id,
        orderNumber: order.order_number,
      };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to create order",
      };
    }
  }

  private async toolGetProductInfo(
    input: Record<string, any>,
    storeId: number,
  ): Promise<any> {
    try {
      const db = getDb();
      const product = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.id, input.product_id || 0),
            eq(products.store_id, storeId),
          ),
        );

      if (product.length === 0) {
        return { error: "Product not found" };
      }

      return {
        id: product[0].id,
        name: product[0].name,
        description: product[0].description,
        price: product[0].price,
        sku: product[0].sku,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Failed to get product",
      };
    }
  }

  private async toolCheckOrderStatus(input: Record<string, any>): Promise<any> {
    try {
      const db = getDb();
      const order = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.order_id || 0));

      if (order.length === 0) {
        return { error: "Order not found" };
      }

      return {
        orderId: order[0].id,
        orderNumber: order[0].order_number,
        status: order[0].status,
        totalAmount: order[0].total_amount,
      };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to check status",
      };
    }
  }

  private async toolListProducts(storeId: number): Promise<any> {
    try {
      const db = getDb();
      const prods = await db
        .select()
        .from(products)
        .where(eq(products.store_id, storeId))
        .limit(10);

      return {
        products: prods.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
        })),
      };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to list products",
      };
    }
  }

  /**
   * Memory management
   */

  private async getOrCreateMemory(
    conversationId: string,
    customerId: number,
    storeId: number,
  ): Promise<AgentMemory> {
    if (this.memory.has(conversationId)) {
      return this.memory.get(conversationId)!;
    }

    const memory: AgentMemory = {
      conversationId,
      customerId,
      storeId,
      messages: [],
      context: {
        lastUpdated: new Date(),
        messageCount: 0,
      },
    };

    this.memory.set(conversationId, memory);
    return memory;
  }

  private async saveMemory(memory: AgentMemory): Promise<void> {
    memory.context.lastUpdated = new Date();
    this.memory.set(memory.conversationId, memory);

    const now = Date.now();
    for (const [key, mem] of this.memory.entries()) {
      if (now - mem.context.lastUpdated.getTime() > 3600000) {
        this.memory.delete(key);
      }
    }
  }

  async getConversationHistory(
    conversationId: string,
  ): Promise<AgentMessage[]> {
    const memory = this.memory.get(conversationId);
    return memory?.messages || [];
  }

  async clearConversation(conversationId: string): Promise<void> {
    this.memory.delete(conversationId);
  }
}

export function createAgentService(config: AgentConfig): AgentService {
  return new AgentService(config);
}
