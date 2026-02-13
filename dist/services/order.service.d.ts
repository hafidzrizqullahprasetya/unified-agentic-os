import type { CreateOrderInput, UpdateOrderStatusInput } from "@/lib/validation";
export declare class OrderService {
    createOrder(storeId: number, customerId: number, data: CreateOrderInput): Promise<{
        items: {
            product_id: number;
            product_variant_id: number | undefined;
            quantity: number;
            unit_price: string;
            subtotal: string;
        }[];
        id: number;
        store_id: number;
        created_at: Date;
        status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
        customer_id: number;
        order_number: string;
        total_amount: string;
        tax_amount: string | null;
        shipping_amount: string | null;
        discount_amount: string | null;
        notes: string | null;
        channel: "whatsapp" | "telegram" | "web" | "mobile" | "api";
        metadata: unknown;
        updated_at: Date;
    }>;
    getOrder(storeId: number, orderId: number): Promise<{
        items: {
            id: number;
            order_id: number;
            product_variant_id: number | null;
            quantity: number;
            created_at: Date;
            product_id: number;
            unit_price: string;
            subtotal: string;
        }[];
        id: number;
        store_id: number;
        created_at: Date;
        status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
        customer_id: number;
        order_number: string;
        total_amount: string;
        tax_amount: string | null;
        shipping_amount: string | null;
        discount_amount: string | null;
        notes: string | null;
        channel: "whatsapp" | "telegram" | "web" | "mobile" | "api";
        metadata: unknown;
        updated_at: Date;
    }>;
    listOrders(storeId: number, customerId?: number, limit?: number, offset?: number): Promise<{
        id: number;
        store_id: number;
        created_at: Date;
        status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
        customer_id: number;
        order_number: string;
        total_amount: string;
        tax_amount: string | null;
        shipping_amount: string | null;
        discount_amount: string | null;
        notes: string | null;
        channel: "whatsapp" | "telegram" | "web" | "mobile" | "api";
        metadata: unknown;
        updated_at: Date;
    }[]>;
    updateOrderStatus(storeId: number, orderId: number, data: UpdateOrderStatusInput): Promise<{
        id: number;
        store_id: number;
        created_at: Date;
        status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
        customer_id: number;
        order_number: string;
        total_amount: string;
        tax_amount: string | null;
        shipping_amount: string | null;
        discount_amount: string | null;
        notes: string | null;
        channel: "whatsapp" | "telegram" | "web" | "mobile" | "api";
        metadata: unknown;
        updated_at: Date;
    }>;
    cancelOrder(storeId: number, orderId: number): Promise<{
        id: number;
        store_id: number;
        created_at: Date;
        status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
        customer_id: number;
        order_number: string;
        total_amount: string;
        tax_amount: string | null;
        shipping_amount: string | null;
        discount_amount: string | null;
        notes: string | null;
        channel: "whatsapp" | "telegram" | "web" | "mobile" | "api";
        metadata: unknown;
        updated_at: Date;
    }>;
    private generateOrderNumber;
}
export declare function createOrderService(): OrderService;
//# sourceMappingURL=order.service.d.ts.map