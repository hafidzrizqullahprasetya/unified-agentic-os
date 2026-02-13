import type { CreateOrderInput, UpdateOrderStatusInput } from '@/lib/validation';
export declare class OrderService {
    createOrder(storeId: number, customerId: number, data: CreateOrderInput): Promise<{
        items: {
            product_id: number;
            product_variant_id: number | undefined;
            quantity: number;
            unit_price: string;
            subtotal: string;
        }[];
        status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
        id: number;
        created_at: Date;
        updated_at: Date;
        store_id: number;
        metadata: unknown;
        customer_id: number;
        order_number: string;
        total_amount: string;
        tax_amount: string | null;
        shipping_amount: string | null;
        discount_amount: string | null;
        notes: string | null;
        channel: "whatsapp" | "telegram" | "web" | "mobile" | "api";
    }>;
    getOrder(storeId: number, orderId: number): Promise<{
        items: {
            id: number;
            created_at: Date;
            product_id: number;
            product_variant_id: number | null;
            quantity: number;
            order_id: number;
            unit_price: string;
            subtotal: string;
        }[];
        status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
        id: number;
        created_at: Date;
        updated_at: Date;
        store_id: number;
        metadata: unknown;
        customer_id: number;
        order_number: string;
        total_amount: string;
        tax_amount: string | null;
        shipping_amount: string | null;
        discount_amount: string | null;
        notes: string | null;
        channel: "whatsapp" | "telegram" | "web" | "mobile" | "api";
    }>;
    listOrders(storeId: number, customerId?: number, limit?: number, offset?: number): Promise<{
        status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
        id: number;
        created_at: Date;
        updated_at: Date;
        store_id: number;
        metadata: unknown;
        customer_id: number;
        order_number: string;
        total_amount: string;
        tax_amount: string | null;
        shipping_amount: string | null;
        discount_amount: string | null;
        notes: string | null;
        channel: "whatsapp" | "telegram" | "web" | "mobile" | "api";
    }[]>;
    updateOrderStatus(storeId: number, orderId: number, data: UpdateOrderStatusInput): Promise<{
        status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
        id: number;
        created_at: Date;
        updated_at: Date;
        store_id: number;
        metadata: unknown;
        customer_id: number;
        order_number: string;
        total_amount: string;
        tax_amount: string | null;
        shipping_amount: string | null;
        discount_amount: string | null;
        notes: string | null;
        channel: "whatsapp" | "telegram" | "web" | "mobile" | "api";
    }>;
    cancelOrder(storeId: number, orderId: number): Promise<{
        status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
        id: number;
        created_at: Date;
        updated_at: Date;
        store_id: number;
        metadata: unknown;
        customer_id: number;
        order_number: string;
        total_amount: string;
        tax_amount: string | null;
        shipping_amount: string | null;
        discount_amount: string | null;
        notes: string | null;
        channel: "whatsapp" | "telegram" | "web" | "mobile" | "api";
    }>;
    private generateOrderNumber;
}
export declare function createOrderService(): OrderService;
//# sourceMappingURL=order.service.d.ts.map