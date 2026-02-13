export interface CreatePaymentInput {
    orderId: number;
    storeId: number;
    amount: number;
    method: "qris" | "bank_transfer" | "credit_card" | "e_wallet" | "cash";
    customerEmail: string;
    customerPhone: string;
    customerName: string;
    orderNumber: string;
}
export interface PaymentResponse {
    id: number;
    orderId: number;
    amount: number;
    status: string;
    method: string;
    snapToken?: string;
    redirectUrl?: string;
}
export declare class PaymentService {
    /**
     * Create payment with Midtrans
     */
    createPayment(input: CreatePaymentInput): Promise<PaymentResponse>;
    /**
     * Get payment by order ID
     */
    getPaymentByOrderId(orderId: number): Promise<{
        status: "pending" | "paid" | "processing" | "failed" | "cancelled" | "refunded";
        order_id: number;
        id: number;
        store_id: number;
        amount: string;
        method: "credit_card" | "bank_transfer" | "qris" | "e_wallet" | "cash";
        reference_id: string | null;
        gateway_response: unknown;
        created_at: Date;
        updated_at: Date;
    }>;
    /**
     * Get payment by reference ID (order number)
     */
    getPaymentByReferenceId(referenceId: string): Promise<{
        status: "pending" | "paid" | "processing" | "failed" | "cancelled" | "refunded";
        order_id: number;
        id: number;
        store_id: number;
        amount: string;
        method: "credit_card" | "bank_transfer" | "qris" | "e_wallet" | "cash";
        reference_id: string | null;
        gateway_response: unknown;
        created_at: Date;
        updated_at: Date;
    }>;
    /**
     * Update payment status
     */
    updatePaymentStatus(paymentId: number, status: string, gatewayResponse?: any): Promise<{
        status: "pending" | "paid" | "processing" | "failed" | "cancelled" | "refunded";
        order_id: number;
        id: number;
        store_id: number;
        amount: string;
        method: "credit_card" | "bank_transfer" | "qris" | "e_wallet" | "cash";
        reference_id: string | null;
        gateway_response: unknown;
        created_at: Date;
        updated_at: Date;
    }>;
    /**
     * Handle Midtrans webhook
     */
    handleMidtransWebhook(webhookBody: any): Promise<{
        success: boolean;
        paymentId: number;
        orderId: number;
        status: string;
    }>;
    /**
     * Check payment status from Midtrans
     */
    checkPaymentStatus(referenceId: string): Promise<any>;
}
export declare const paymentService: PaymentService;
//# sourceMappingURL=payment.service.d.ts.map