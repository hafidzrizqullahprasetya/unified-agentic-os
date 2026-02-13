/**
 * LLM Provider Abstraction
 * Unified interface for Claude, GPT, Llama
 */

import { generateText, LanguageModel } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LLMProvider, LLMProviderConfig } from "@/lib/agent.types";
import { getEnv } from "@/env";
import { ValidationError } from "@/lib/errors";

export class LLMProviderFactory {
  static createProvider(
    provider: LLMProvider,
    config?: LLMProviderConfig,
  ): LanguageModel {
    const env = getEnv();

    switch (provider) {
      case "claude":
        const claudeApiKey = config?.apiKey || env.ANTHROPIC_API_KEY;
        if (!claudeApiKey) {
          throw new ValidationError("ANTHROPIC_API_KEY not configured");
        }
        const anthropic = createAnthropic({ apiKey: claudeApiKey });
        return anthropic(config?.model || "claude-3-5-sonnet-20241022");

      case "gpt":
        const gptApiKey = config?.apiKey || env.OPENAI_API_KEY;
        if (!gptApiKey) {
          throw new ValidationError("OPENAI_API_KEY not configured");
        }
        const openai = createOpenAI({ apiKey: gptApiKey });
        return openai(config?.model || "gpt-4-turbo");

      case "llama":
        // For Llama, we can use OpenAI-compatible API (e.g., Together.ai, Ollama)
        const llamaApiKey = config?.apiKey || env.LLAMA_API_KEY;
        if (!llamaApiKey) {
          throw new ValidationError("LLAMA_API_KEY not configured");
        }
        const llamaProvider = createOpenAI({
          apiKey: llamaApiKey,
          baseURL: env.LLAMA_BASE_URL || "http://localhost:8000/v1",
        });
        return llamaProvider(config?.model || "meta-llama/Llama-2-7b-chat");

      default:
        throw new ValidationError(`Unsupported LLM provider: ${provider}`);
    }
  }
}
