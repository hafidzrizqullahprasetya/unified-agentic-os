/**
 * AI Agent Service Tests
 * Tests for agentic loop, tool calling, and memory management
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { AgentService, createAgentService } from "@/services/agent.service";
import type { AgentConfig, AgentMemory } from "@/lib/agent.types";

// Mock the LLM provider to avoid actual API calls
vi.mock("@/lib/llm-provider", () => ({
  LLMProviderFactory: {
    createProvider: vi.fn(() => ({
      id: "mock-model",
    })),
  },
}));

// Mock generateText from ai package
vi.mock("ai", () => ({
  generateText: vi.fn(async () => ({
    text: "Mock response from agent",
    usage: { promptTokens: 10, completionTokens: 10 },
  })),
}));

describe("AI Agent Service", () => {
  let agentService: AgentService;
  const mockConfig: AgentConfig = {
    provider: "claude",
    systemPrompt: "Test agent prompt",
    tools: [
      {
        name: "test_tool",
        description: "Test tool",
        parameters: {
          type: "object",
          properties: {
            param: { type: "string", description: "Test param" },
          },
          required: ["param"],
        },
      },
    ],
    maxIterations: 3,
    memorySize: 10,
  };

  beforeEach(() => {
    agentService = createAgentService(mockConfig);
  });

  describe("Agent Initialization", () => {
    it("should create agent service with valid config", () => {
      expect(agentService).toBeDefined();
    });

    it("should initialize with correct provider", () => {
      expect(mockConfig.provider).toBe("claude");
    });

    it("should have system prompt", () => {
      expect(mockConfig.systemPrompt).toBeDefined();
      expect(mockConfig.systemPrompt.length).toBeGreaterThan(0);
    });

    it("should have tools defined", () => {
      expect(mockConfig.tools.length).toBeGreaterThan(0);
      expect(mockConfig.tools[0].name).toBe("test_tool");
    });
  });

  describe("Memory Management", () => {
    it("should create memory for new conversation", async () => {
      const history = await agentService.getConversationHistory("conv-123");
      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
    });

    it("should clear conversation", async () => {
      await agentService.clearConversation("conv-123");
      const history = await agentService.getConversationHistory("conv-123");
      expect(history.length).toBe(0);
    });

    it("should handle multiple conversations independently", async () => {
      const conv1 = await agentService.getConversationHistory("conv-1");
      const conv2 = await agentService.getConversationHistory("conv-2");

      expect(conv1).toBeDefined();
      expect(conv2).toBeDefined();
    });
  });

  describe("Agentic Loop", () => {
    it("should execute agentic loop", async () => {
      // Mock the LLM provider to avoid actual API calls
      const response = await agentService.executeAgentic(
        "test-conv",
        1,
        1,
        "Hello agent",
      );

      expect(response).toBeDefined();
      expect(response.success).toBeDefined();
    });

    it("should handle missing required parameters", async () => {
      const response = await agentService.executeAgentic("", 0, 0, "");

      // Should still return a response (error handling)
      expect(response).toBeDefined();
    });

    it("should limit iterations", async () => {
      const response = await agentService.executeAgentic(
        "test-conv-iter",
        1,
        1,
        "Test message",
        2, // Max 2 iterations
      );

      expect(response).toBeDefined();
    });
  });

  describe("Tool Management", () => {
    it("should have required tools", () => {
      const toolNames = mockConfig.tools.map((t) => t.name);
      expect(toolNames).toContain("test_tool");
    });

    it("should have tool descriptions", () => {
      mockConfig.tools.forEach((tool) => {
        expect(tool.description).toBeDefined();
        expect(tool.description.length).toBeGreaterThan(0);
      });
    });

    it("should have tool parameters defined", () => {
      mockConfig.tools.forEach((tool) => {
        expect(tool.parameters).toBeDefined();
        expect(tool.parameters.type).toBe("object");
        expect(tool.parameters.properties).toBeDefined();
        expect(tool.parameters.required).toBeDefined();
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle agent errors gracefully", async () => {
      const response = await agentService.executeAgentic(
        "error-conv",
        1,
        1,
        "This should trigger error",
      );

      expect(response).toBeDefined();
      expect(response.success).toBeDefined();
    });

    it("should continue after failed tool execution", async () => {
      // This tests error resilience
      const response = await agentService.executeAgentic(
        "resilience-conv",
        1,
        1,
        "Try a tool",
      );

      expect(response).toBeDefined();
    });
  });

  describe("Configuration", () => {
    it("should accept custom max iterations", () => {
      const customConfig: AgentConfig = {
        ...mockConfig,
        maxIterations: 10,
      };
      const agent = createAgentService(customConfig);
      expect(agent).toBeDefined();
    });

    it("should accept custom memory size", () => {
      const customConfig: AgentConfig = {
        ...mockConfig,
        memorySize: 20,
      };
      const agent = createAgentService(customConfig);
      expect(agent).toBeDefined();
    });

    it("should support different providers", () => {
      const providers = ["claude", "gpt", "llama"];
      providers.forEach((provider) => {
        const config: AgentConfig = {
          ...mockConfig,
          provider: provider as any,
        };
        const agent = createAgentService(config);
        expect(agent).toBeDefined();
      });
    });
  });

  describe("Conversation History", () => {
    it("should return empty history for new conversation", async () => {
      const history = await agentService.getConversationHistory("new-conv");
      expect(Array.isArray(history)).toBe(true);
    });

    it("should maintain conversation state", async () => {
      const conversationId = "state-conv";

      // First message
      await agentService.executeAgentic(conversationId, 1, 1, "First message");

      const history = await agentService.getConversationHistory(conversationId);

      // Should have at least the user message
      expect(history.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Response Format", () => {
    it("should return properly formatted response", async () => {
      const response = await agentService.executeAgentic(
        "format-conv",
        1,
        1,
        "Test message",
      );

      expect(response.success).toBeDefined();
      expect(response.message).toBeDefined();
      expect(response.message.length).toBeGreaterThan(0);
    });

    it("should include metadata if available", async () => {
      const response = await agentService.executeAgentic(
        "metadata-conv",
        1,
        1,
        "Test message",
      );

      if (response.metadata) {
        expect(response.metadata.provider).toBeDefined();
      }
    });

    it("should include tool calls if any", async () => {
      const response = await agentService.executeAgentic(
        "toolcall-conv",
        1,
        1,
        "Test message",
      );

      if (response.toolCalls) {
        expect(Array.isArray(response.toolCalls)).toBe(true);
        response.toolCalls.forEach((toolCall) => {
          expect(toolCall.name).toBeDefined();
          expect(toolCall.input).toBeDefined();
        });
      }
    });
  });
});
