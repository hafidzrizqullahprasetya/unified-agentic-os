import { whatsAppService, } from "@/services/whatsapp.service";
import { ValidationError } from "@/lib/errors";
import { getDb } from "@/db/config";
import { customers, stores } from "@/db/schema";
import { eq } from "drizzle-orm";
/**
 * GET /api/webhooks/whatsapp
 * Webhook verification endpoint for Meta
 * Meta sends a GET request with verify_token, challenge parameters
 */
export async function whatsappWebhookVerify(c) {
    try {
        const verifyToken = c.req.query("hub.verify_token");
        const challenge = c.req.query("hub.challenge");
        const mode = c.req.query("hub.mode");
        if (mode !== "subscribe") {
            return c.text("Invalid mode", 403);
        }
        const env = await import("@/env").then((m) => m.getEnv());
        if (verifyToken !== env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
            return c.text("Verify token mismatch", 403);
        }
        // Meta expects the challenge value returned
        return c.text(challenge || "");
    }
    catch (error) {
        console.error("Webhook verification error:", error);
        return c.text("Verification failed", 400);
    }
}
/**
 * POST /api/webhooks/whatsapp
 * Handle incoming WhatsApp messages from Meta
 */
export async function whatsappWebhookReceive(c) {
    try {
        // Get signature from header for verification
        const signature = c.req.header("x-hub-signature-256");
        if (!signature) {
            throw new ValidationError("Missing X-Hub-Signature-256 header");
        }
        // Get raw body for signature verification
        const body = await c.req.text();
        // Verify webhook signature
        if (!whatsAppService.verifyWebhookSignature(signature, body)) {
            return c.text("Signature verification failed", 403);
        }
        // Parse payload
        let payload;
        try {
            payload = JSON.parse(body);
        }
        catch {
            throw new ValidationError("Invalid JSON payload");
        }
        // Extract incoming message
        const incomingMessage = whatsAppService.parseIncomingMessage(payload);
        if (!incomingMessage) {
            // Not a message event, just return 200 OK
            return c.json({ success: true }, 200);
        }
        // Find store and customer
        // NOTE: In production, you would need a way to map the WhatsApp phone to a specific store
        // For now, we'll use the first store (or you can pass store_id via metadata)
        const db = getDb();
        // Get first store (in production, this should be configurable)
        const storeResult = await db.select().from(stores).limit(1);
        if (storeResult.length === 0) {
            console.error("No store found for WhatsApp webhook");
            return c.json({ success: false, error: "No store configured" }, 400);
        }
        const storeId = storeResult[0].id;
        // Get or create customer
        const customer = await whatsAppService.getOrCreateCustomer(storeId, incomingMessage.from);
        // Save incoming message
        await whatsAppService.saveMessage(storeId, customer.id, incomingMessage.text, "inbound", incomingMessage.type, {
            message_id: incomingMessage.messageId,
            timestamp: incomingMessage.timestamp,
        });
        // Immediately return 200 OK to Meta (don't process synchronously)
        // The actual processing will happen asynchronously
        c.status(200);
        // Process message asynchronously (non-blocking)
        handleMessageAsync(storeId, customer.id, incomingMessage).catch((error) => {
            console.error("Failed to process WhatsApp message:", error);
        });
        return c.json({ success: true }, 200);
    }
    catch (error) {
        console.error("WhatsApp webhook error:", error);
        // Always return 200 OK to Meta to prevent retry storms
        // Log the error for debugging
        if (error instanceof (await import("@/lib/errors")).AppError) {
            console.error("App error:", error.message);
        }
        return c.json({ success: false, error: "Processing error" }, 200);
    }
}
/**
 * Asynchronous message handler
 * This runs after returning 200 OK to Meta
 * Routes message through AI Agent for intelligent handling
 */
async function handleMessageAsync(storeId, customerId, message) {
    if (!message)
        return;
    const db = getDb();
    const customer = await db
        .select()
        .from(customers)
        .where(eq(customers.id, customerId));
    if (!customer.length)
        return;
    try {
        // Route message through AI Agent for intelligent response
        const { whatsAppAgentService } = await import("@/services/whatsapp-agent.service");
        const agentResponse = await whatsAppAgentService.handleIncomingMessage(message, storeId);
        // Send AI Agent response to customer
        await whatsAppService.sendMessage(customer[0].phone, agentResponse);
        // Save outbound message
        await whatsAppService.saveMessage(storeId, customerId, agentResponse, "outbound");
    }
    catch (error) {
        console.error("Error handling WhatsApp message with agent:", error);
        // Send error message to customer
        try {
            await whatsAppService.sendMessage(customer[0].phone, "Terjadi kesalahan dalam memproses pesan Anda. Silakan coba lagi nanti atau hubungi admin.");
        }
        catch (innerError) {
            console.error("Failed to send error message:", innerError);
        }
    }
}
/**
 * Legacy: Handle menu request (kept for backwards compatibility)
 */
async function handleMenuRequest(storeId, customerId, message) {
    if (!message)
        return;
    const db = getDb();
    const customer = await db
        .select()
        .from(customers)
        .where(eq(customers.id, customerId));
    if (!customer.length)
        return;
    try {
        const products = await whatsAppService.getStoreProducts(storeId);
        const menuMessage = whatsAppService.formatProductMenu(products);
        await whatsAppService.sendMessage(customer[0].phone, menuMessage);
        await whatsAppService.saveMessage(storeId, customerId, menuMessage, "outbound");
    }
    catch (error) {
        console.error("Failed to send menu:", error);
        throw error;
    }
}
/**
 * Handle order request
 * Creates order via OrderService and sends confirmation with payment link
 */
async function handleOrderRequest(storeId, customerId, message) {
    if (!message)
        return;
    const db = getDb();
    const customer = await db
        .select()
        .from(customers)
        .where(eq(customers.id, customerId));
    if (!customer.length)
        return;
    try {
        const { WhatsAppParser } = await import("@/lib/whatsapp-parser");
        const parser = new WhatsAppParser();
        const details = parser.extractOrderDetails(message.text);
        if (!details || !details.productId) {
            await whatsAppService.sendMessage(customer[0].phone, "Format pesanan tidak valid.\nContoh: `order 1 qty 2`");
            return;
        }
        // Create order using WhatsAppService
        const order = await whatsAppService.createOrderFromMessage(storeId, customerId, details.productId, details.quantity);
        // Get order items for confirmation message
        const orderWithProducts = await whatsAppService.getOrderWithProducts(storeId, order.id);
        if (orderWithProducts) {
            // Generate payment link
            const { PaymentService } = await import("@/services/payment.service");
            const paymentService = new PaymentService();
            const paymentResponse = await paymentService.createPayment({
                orderId: order.id,
                storeId,
                amount: parseFloat(order.total_amount),
                method: "qris",
                customerEmail: customer[0].email || `${customer[0].phone}@whatsapp.local`,
                customerPhone: customer[0].phone,
                customerName: customer[0].name,
                orderNumber: order.order_number,
            });
            // Format and send confirmation with payment link
            const confirmMessage = whatsAppService.formatOrderConfirmation(order, orderWithProducts.items, paymentResponse.redirectUrl || paymentResponse.snapToken);
            await whatsAppService.sendMessage(customer[0].phone, confirmMessage);
            await whatsAppService.saveMessage(storeId, customerId, confirmMessage, "outbound");
        }
    }
    catch (error) {
        console.error("Failed to process order request:", error);
        // Send error message to customer
        try {
            await whatsAppService.sendMessage(customer[0].phone, "Maaf, terjadi kesalahan dalam memproses pesanan. Silakan coba lagi nanti.");
        }
        catch {
            // Ignore send errors
        }
        throw error;
    }
}
/**
 * Handle status request
 * Retrieves order status and sends update to customer
 */
async function handleStatusRequest(storeId, customerId, message) {
    if (!message)
        return;
    const db = getDb();
    const customer = await db
        .select()
        .from(customers)
        .where(eq(customers.id, customerId));
    if (!customer.length)
        return;
    try {
        const { WhatsAppParser } = await import("@/lib/whatsapp-parser");
        const parser = new WhatsAppParser();
        const orderNumber = parser.extractOrderNumber(message.text);
        if (!orderNumber) {
            await whatsAppService.sendMessage(customer[0].phone, "Mohon sertakan nomor pesanan untuk tracking.\nContoh: `status #123` atau `track 123`");
            return;
        }
        // Get order
        const order = await whatsAppService.getOrderByNumber(storeId, orderNumber);
        if (!order) {
            await whatsAppService.sendMessage(customer[0].phone, `Pesanan dengan nomor ${orderNumber} tidak ditemukan.`);
            return;
        }
        // Send order status
        const statusMessage = whatsAppService.formatOrderStatus(order);
        await whatsAppService.sendMessage(customer[0].phone, statusMessage);
        await whatsAppService.saveMessage(storeId, customerId, statusMessage, "outbound");
    }
    catch (error) {
        console.error("Failed to handle status request:", error);
        throw error;
    }
}
//# sourceMappingURL=whatsapp.js.map