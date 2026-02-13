import { getDb } from "../db/config";
import { payments, payment_webhook_logs } from "../db/schema";
import { eq } from "drizzle-orm";
import { createPaymentTransaction, getPaymentStatus, handleWebhook as processMidtransWebhook, } from "../lib/midtrans";
export class PaymentService {
    /**
     * Create payment with Midtrans
     */
    async createPayment(input) {
        // For cash, skip Midtrans
        if (input.method === "cash") {
            const db = getDb();
            const payment = await db
                .insert(payments)
                .values({
                order_id: input.orderId,
                store_id: input.storeId,
                amount: input.amount.toString(),
                status: "paid",
                method: "cash",
                reference_id: `CASH-${Date.now()}`,
                gateway_response: JSON.stringify({ type: "cash_payment" }),
            })
                .returning();
            return {
                id: payment[0].id,
                orderId: payment[0].order_id,
                amount: Number(payment[0].amount),
                status: "paid",
                method: "cash",
            };
        }
        // Create Midtrans transaction
        const { token, redirect_url } = await createPaymentTransaction({
            transaction: {
                order_id: input.orderNumber,
                gross_amount: Number(input.amount),
            },
            customer: {
                first_name: input.customerName.split(" ")[0],
                last_name: input.customerName.split(" ").slice(1).join(" ") || undefined,
                email: input.customerEmail,
                phone: input.customerPhone,
            },
            items: [
                {
                    id: `ORDER-${input.orderId}`,
                    name: `Order #${input.orderNumber}`,
                    price: Number(input.amount),
                    quantity: 1,
                },
            ],
        });
        // Save payment record
        const db = getDb();
        const payment = await db
            .insert(payments)
            .values({
            order_id: input.orderId,
            store_id: input.storeId,
            amount: input.amount.toString(),
            status: "pending",
            method: input.method,
            reference_id: input.orderNumber,
            gateway_response: JSON.stringify({
                snap_token: token,
                redirect_url: redirect_url,
            }),
        })
            .returning();
        return {
            id: payment[0].id,
            orderId: payment[0].order_id,
            amount: Number(payment[0].amount),
            status: "pending",
            method: payment[0].method,
            snapToken: token,
            redirectUrl: redirect_url,
        };
    }
    /**
     * Get payment by order ID
     */
    async getPaymentByOrderId(orderId) {
        const db = getDb();
        const result = await db
            .select()
            .from(payments)
            .where(eq(payments.order_id, orderId));
        return result[0] || null;
    }
    /**
     * Get payment by reference ID (order number)
     */
    async getPaymentByReferenceId(referenceId) {
        const db = getDb();
        const result = await db
            .select()
            .from(payments)
            .where(eq(payments.reference_id, referenceId));
        return result[0] || null;
    }
    /**
     * Update payment status
     */
    async updatePaymentStatus(paymentId, status, gatewayResponse) {
        const db = getDb();
        const updated = await db
            .update(payments)
            .set({
            status: status,
            gateway_response: gatewayResponse
                ? JSON.stringify(gatewayResponse)
                : undefined,
            updated_at: new Date(),
        })
            .where(eq(payments.id, paymentId))
            .returning();
        return updated[0];
    }
    /**
     * Handle Midtrans webhook
     */
    async handleMidtransWebhook(webhookBody) {
        try {
            // Process webhook and get status
            const { orderId, status, transactionStatus, statusCode } = await processMidtransWebhook(webhookBody);
            // Log webhook
            await getDb()
                .insert(payment_webhook_logs)
                .values({
                store_id: 0, // Will be updated when we fetch payment
                gateway: "midtrans",
                event_type: transactionStatus,
                payload: JSON.stringify(webhookBody),
                processed: true,
            });
            // Find payment and update
            const payment = await this.getPaymentByReferenceId(orderId);
            if (!payment) {
                throw new Error(`Payment not found for order: ${orderId}`);
            }
            // Update payment status
            await this.updatePaymentStatus(payment.id, status, {
                midtrans_status: transactionStatus,
                status_code: statusCode,
                processed_at: new Date().toISOString(),
            });
            return {
                success: true,
                paymentId: payment.id,
                orderId: payment.order_id,
                status: status,
            };
        }
        catch (error) {
            // Log failed webhook
            await getDb()
                .insert(payment_webhook_logs)
                .values({
                store_id: 0,
                gateway: "midtrans",
                event_type: "webhook_error",
                payload: JSON.stringify(webhookBody),
                processed: false,
                error_message: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Check payment status from Midtrans
     */
    async checkPaymentStatus(referenceId) {
        try {
            const status = await getPaymentStatus(referenceId);
            return status;
        }
        catch (error) {
            console.error("Error checking payment status:", error);
            throw error;
        }
    }
}
export const paymentService = new PaymentService();
//# sourceMappingURL=payment.service.js.map