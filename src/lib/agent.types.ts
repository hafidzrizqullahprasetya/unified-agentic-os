/**
 * Agent Types and Interfaces
 * Core type definitions for AI agent system
 */

export type LLMProvider = "claude" | "gpt" | "llama";

export interface AgentToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<
      string,
      {
        type: string;
        description: string;
        enum?: string[];
      }
    >;
    required: string[];
  };
}

export interface AgentToolCall {
  id: string;
  type: "tool_use";
  name: string;
  input: Record<string, any>;
}

export interface AgentMessage {
  role: "user" | "assistant" | "system";
  content: string;
  toolCalls?: AgentToolCall[];
  toolResults?: Array<{
    toolUseId: string;
    content: string;
  }>;
}

export interface AgentMemory {
  conversationId: string;
  customerId: number;
  storeId: number;
  messages: AgentMessage[];
  context: {
    lastUpdated: Date;
    messageCount: number;
    intent?: string;
  };
}

export interface AgentResponse {
  success: boolean;
  message: string;
  toolCalls?: AgentToolCall[];
  metadata?: {
    tokensUsed?: number;
    executionTime?: number;
    provider?: LLMProvider;
  };
}

export interface LLMProviderConfig {
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AgentConfig {
  provider: LLMProvider;
  systemPrompt: string;
  tools: AgentToolDefinition[];
  maxIterations?: number;
  memorySize?: number;
}

export interface ToolExecutionResult {
  toolName: string;
  success: boolean;
  result: any;
  error?: string;
}
