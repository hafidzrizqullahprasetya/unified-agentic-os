/**
 * WhatsApp + AI Agent Integration Service
 * Routes WhatsApp messages through AI Agent for intelligent responses
 */
import type { IncomingMessage } from "@/services/whatsapp.service";
import type { AgentConfig } from "@/lib/agent.types";
export declare class WhatsAppAgentService {
    private agentService;
    private conversationMap;
    constructor(agentConfig: AgentConfig);
    /**
     * Process incoming WhatsApp message and generate response using AI Agent
     */
    handleIncomingMessage(message: IncomingMessage, storeId: number): Promise<string>;
    /**
     * Get conversation history for a customer
     */
    getConversationHistory(phoneNumber: string): Promise<import("@/lib/agent.types").AgentMessage[]>;
    /**
     * Clear conversation for a customer
     */
    clearConversation(phoneNumber: string): Promise<void>;
}
/**
 * Factory function to create WhatsApp Agent Service with default config
 */
export declare function createWhatsAppAgentService(): WhatsAppAgentService;
export declare const whatsAppAgentService: WhatsAppAgentService;
//# sourceMappingURL=whatsapp-agent.service.d.ts.map