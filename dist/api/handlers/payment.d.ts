import { Context } from "hono";
/**
 * POST /api/payments/create
 * Create payment transaction
 */
export declare function createPayment(c: Context): Promise<(Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 401, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    data: {
        id: number;
        orderId: number;
        amount: number;
        status: string;
        method: string;
        snapToken?: string | undefined;
        redirectUrl?: string | undefined;
    };
}, 201, "json">)>;
/**
 * GET /api/payments/:paymentId
 * Get payment details
 */
export declare function getPayment(c: Context): Promise<(Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 401, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    data: {
        status: "pending" | "paid" | "processing" | "failed" | "cancelled" | "refunded";
        order_id: number;
        id: number;
        store_id: number;
        amount: string;
        method: "credit_card" | "bank_transfer" | "qris" | "e_wallet" | "cash";
        reference_id: string | null;
        gateway_response: import("hono/utils/types").JSONValue;
        created_at: string;
        updated_at: string;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">)>;
/**
 * GET /api/payments/status/:referenceId
 * Check payment status
 */
export declare function checkPaymentStatus(c: Context): Promise<(Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 401, "json">) | (Response & import("hono").TypedResponse<{
    success: true;
    data: any;
}, import("hono/utils/http-status").ContentfulStatusCode, "json">)>;
/**
 * POST /api/payments/webhook/midtrans
 * Midtrans webhook handler (no auth required)
 */
export declare function midtransWebhook(c: Context): Promise<(Response & import("hono").TypedResponse<{
    success: true;
    data: {
        success: boolean;
        paymentId: number;
        orderId: number;
        status: string;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 200, "json">)>;
//# sourceMappingURL=payment.d.ts.map