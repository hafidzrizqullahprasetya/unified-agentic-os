import { eq } from "drizzle-orm";
import { getDb } from "@/db/config";
import { orders, order_items, order_status_history, stores, customers, products, } from "@/db/schema";
import { NotFoundError, ForbiddenError, } from "@/lib/errors";
import { inventoryService } from "@/services/inventory.service";
export class OrderService {
    async createOrder(storeId, customerId, data) {
        const db = getDb();
        // Verify store and customer exist
        const store = await db.select().from(stores).where(eq(stores.id, storeId));
        if (!store.length) {
            throw new NotFoundError("Store", storeId);
        }
        const customer = await db
            .select()
            .from(customers)
            .where(eq(customers.id, customerId));
        if (!customer.length || customer[0].store_id !== storeId) {
            throw new NotFoundError("Customer", customerId);
        }
        // Calculate totals
        let totalAmount = 0;
        const items = [];
        for (const item of data.items) {
            const product = await db
                .select()
                .from(products)
                .where(eq(products.id, item.product_id));
            if (!product.length || product[0].store_id !== storeId) {
                throw new NotFoundError("Product", item.product_id);
            }
            const unitPrice = parseFloat(product[0].price);
            const subtotal = unitPrice * item.quantity;
            totalAmount += subtotal;
            items.push({
                product_id: item.product_id,
                product_variant_id: item.product_variant_id,
                quantity: item.quantity,
                unit_price: product[0].price,
                subtotal: String(subtotal),
            });
        }
        // Generate order number
        const orderNumber = this.generateOrderNumber(storeId);
        // Create order
        const result = await db
            .insert(orders)
            .values({
            store_id: storeId,
            customer_id: customerId,
            order_number: orderNumber,
            total_amount: String(totalAmount),
            notes: data.notes,
            channel: data.channel || "web",
        })
            .returning();
        const order = result[0];
        // Create order items
        for (const item of items) {
            await db.insert(order_items).values({
                order_id: order.id,
                ...item,
            });
        }
        // Reserve inventory for the order
        try {
            const reservationItems = data.items
                .filter((item) => item.product_variant_id)
                .map((item) => ({
                product_variant_id: item.product_variant_id,
                quantity: item.quantity,
            }));
            if (reservationItems.length > 0) {
                await inventoryService.reserveStock(order.id, reservationItems, storeId);
            }
        }
        catch (error) {
            // If inventory reservation fails, cancel the order we just created
            await db
                .update(orders)
                .set({ status: "cancelled" })
                .where(eq(orders.id, order.id));
            throw error;
        }
        // Record initial status
        await db.insert(order_status_history).values({
            order_id: order.id,
            to_status: "pending",
            notes: "Order created",
        });
        return {
            ...order,
            items,
        };
    }
    async getOrder(storeId, orderId) {
        const db = getDb();
        const result = await db.select().from(orders).where(eq(orders.id, orderId));
        if (!result.length) {
            throw new NotFoundError("Order", orderId);
        }
        const order = result[0];
        if (order.store_id !== storeId) {
            throw new ForbiddenError("You do not have access to this order");
        }
        // Get order items
        const items = await db
            .select()
            .from(order_items)
            .where(eq(order_items.order_id, orderId));
        return {
            ...order,
            items,
        };
    }
    async listOrders(storeId, customerId, limit = 50, offset = 0) {
        const db = getDb();
        if (customerId) {
            return await db
                .select()
                .from(orders)
                .where(eq(orders.store_id, storeId) && eq(orders.customer_id, customerId))
                .limit(limit)
                .offset(offset);
        }
        return await db
            .select()
            .from(orders)
            .where(eq(orders.store_id, storeId))
            .limit(limit)
            .offset(offset);
    }
    async updateOrderStatus(storeId, orderId, data) {
        const db = getDb();
        // Verify order exists and belongs to store
        const order = await this.getOrder(storeId, orderId);
        const result = await db
            .update(orders)
            .set({
            status: data.status,
            updated_at: new Date(),
        })
            .where(eq(orders.id, orderId))
            .returning();
        // Record status change
        await db.insert(order_status_history).values({
            order_id: orderId,
            from_status: order.status,
            to_status: data.status,
            notes: data.notes,
        });
        return result[0];
    }
    async cancelOrder(storeId, orderId) {
        const db = getDb();
        // Verify order exists and belongs to store
        const order = await this.getOrder(storeId, orderId);
        if (order.status === "cancelled" || order.status === "delivered") {
            throw new Error(`Cannot cancel order with status: ${order.status}`);
        }
        // Release reservations for this order
        const reservations = await inventoryService.getOrderReservations(orderId);
        for (const reservation of reservations) {
            if (!reservation.released_at) {
                await inventoryService.releaseReservation(reservation.id, storeId);
            }
        }
        return this.updateOrderStatus(storeId, orderId, {
            status: "cancelled",
            notes: "Cancelled by seller",
        });
    }
    generateOrderNumber(storeId) {
        // Format: STORE-TIMESTAMP-RANDOM
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `ORD-${storeId}-${timestamp}-${random}`;
    }
}
export function createOrderService() {
    return new OrderService();
}
//# sourceMappingURL=order.service.js.map