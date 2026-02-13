export interface MidtransTransactionDetails {
    order_id: string;
    gross_amount: number;
}
export interface MidtransCustomerDetails {
    first_name: string;
    last_name?: string;
    email: string;
    phone: string;
}
export interface MidtransPaymentItem {
    id: string;
    price: number;
    quantity: number;
    name: string;
}
export interface CreatePaymentParams {
    transaction: MidtransTransactionDetails;
    customer: MidtransCustomerDetails;
    items: MidtransPaymentItem[];
    payment_type?: "credit_card" | "bank_transfer" | "qris" | "e_wallet";
}
/**
 * Create payment transaction and get Snap token for frontend
 */
export declare function createPaymentTransaction(params: CreatePaymentParams): Promise<{
    token: string;
    redirect_url: string;
}>;
/**
 * Charge payment directly (for other payment methods)
 */
export declare function chargePayment(orderId: string, amount: number, paymentMethod: "bank_transfer" | "qris" | "credit_card", customerEmail: string): Promise<any>;
/**
 * Get payment status
 */
export declare function getPaymentStatus(orderId: string): Promise<any>;
/**
 * Verify webhook signature from Midtrans
 */
export declare function verifyWebhookSignature(orderId: string, statusCode: string, grossAmount: number | string, serverKey: string, signatureKey: string): boolean;
/**
 * Handle webhook and update payment status
 */
export declare function handleWebhook(webhookBody: any): Promise<{
    orderId: any;
    status: string;
    transactionStatus: any;
    statusCode: any;
}>;
//# sourceMappingURL=midtrans.d.ts.map