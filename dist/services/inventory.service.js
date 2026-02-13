import { getDb } from "@/db/config";
import { inventory_reservations, inventory_movements, product_variants, } from "@/db/schema";
import { InventoryError, NotFoundError, ValidationError } from "@/lib/errors";
import { ErrorCode } from "@/lib/errors";
import { eq, and, sql, isNull } from "drizzle-orm";
export class InventoryService {
    /**
     * Get current stock level for a product variant
     * Calculates: current_stock, reserved_quantity, available_stock
     */
    async getStockLevel(variantId) {
        const db = getDb();
        // Get variant details
        const variant = await db
            .select({
            id: product_variants.id,
            sku: product_variants.sku,
            stock_quantity: product_variants.stock_quantity,
        })
            .from(product_variants)
            .where(eq(product_variants.id, variantId))
            .limit(1);
        if (!variant || variant.length === 0) {
            throw new NotFoundError("Product Variant", variantId);
        }
        // Get reserved quantity for this variant
        const reservedResult = await db
            .select({
            reserved: sql `COALESCE(SUM(${inventory_reservations.quantity}), 0)`,
        })
            .from(inventory_reservations)
            .where(and(eq(inventory_reservations.product_variant_id, variantId), isNull(inventory_reservations.released_at)));
        const reserved = reservedResult[0]?.reserved || 0;
        const currentStock = variant[0].stock_quantity || 0;
        const availableStock = Math.max(0, currentStock - reserved);
        return {
            variant_id: variantId,
            sku: variant[0].sku || "",
            current_stock: currentStock,
            reserved_quantity: reserved,
            available_stock: availableStock,
        };
    }
    /**
     * Reserve stock for an order
     * Creates inventory reservations for each order item
     */
    async reserveStock(orderId, items, storeId) {
        const db = getDb();
        const reservations = [];
        for (const item of items) {
            // Validate variant exists
            const variant = await db
                .select({
                id: product_variants.id,
                stock_quantity: product_variants.stock_quantity,
            })
                .from(product_variants)
                .where(eq(product_variants.id, item.product_variant_id))
                .limit(1);
            if (!variant || variant.length === 0) {
                throw new NotFoundError("Product Variant", item.product_variant_id);
            }
            // Check available stock
            const stockLevel = await this.getStockLevel(item.product_variant_id);
            if (item.quantity > stockLevel.available_stock) {
                throw new InventoryError(ErrorCode.INSUFFICIENT_STOCK, `Only ${stockLevel.available_stock} units available for variant ${stockLevel.sku}`, { available: stockLevel.available_stock, requested: item.quantity });
            }
            // Create reservation
            const result = await db
                .insert(inventory_reservations)
                .values({
                order_id: orderId,
                product_variant_id: item.product_variant_id,
                quantity: item.quantity,
            })
                .returning();
            if (result && result.length > 0) {
                reservations.push(result[0]);
            }
            // Log movement
            await this.addMovement(item.product_variant_id, storeId, "out", -item.quantity, "order_reservation", orderId.toString());
        }
        return reservations;
    }
    /**
     * Release a reservation (when order is cancelled)
     */
    async releaseReservation(reservationId, storeId) {
        const db = getDb();
        // Get reservation details
        const reservation = await db
            .select()
            .from(inventory_reservations)
            .where(eq(inventory_reservations.id, reservationId))
            .limit(1);
        if (!reservation || reservation.length === 0) {
            throw new NotFoundError("Reservation", reservationId);
        }
        const res = reservation[0];
        // Check if already released
        if (res.released_at) {
            throw new ValidationError("Reservation has already been released");
        }
        // Mark as released
        await db
            .update(inventory_reservations)
            .set({ released_at: new Date() })
            .where(eq(inventory_reservations.id, reservationId));
        // Log movement (reverse the reservation)
        await this.addMovement(res.product_variant_id, storeId, "in", res.quantity, "reservation_release", reservationId.toString());
    }
    /**
     * Manually adjust inventory stock
     * Used for stock corrections, returns, damages, etc.
     */
    async adjustStock(variantId, storeId, quantityChange, reason, createdById) {
        const db = getDb();
        // Validate variant exists
        const variant = await db
            .select({
            id: product_variants.id,
            stock_quantity: product_variants.stock_quantity,
        })
            .from(product_variants)
            .where(eq(product_variants.id, variantId))
            .limit(1);
        if (!variant || variant.length === 0) {
            throw new NotFoundError("Product Variant", variantId);
        }
        // Quantity cannot be zero
        if (quantityChange === 0) {
            throw new ValidationError("Quantity change cannot be zero");
        }
        // Update stock quantity
        const newStock = Math.max(0, (variant[0].stock_quantity || 0) + quantityChange);
        await db
            .update(product_variants)
            .set({ stock_quantity: newStock, updated_at: new Date() })
            .where(eq(product_variants.id, variantId));
        // Log movement
        const movementType = quantityChange > 0 ? "in" : "out";
        await this.addMovement(variantId, storeId, movementType, quantityChange, reason);
    }
    /**
     * Get all reservations for an order
     */
    async getOrderReservations(orderId) {
        const db = getDb();
        const results = await db
            .select()
            .from(inventory_reservations)
            .where(eq(inventory_reservations.order_id, orderId));
        return results;
    }
    /**
     * Get movement history for a variant
     */
    async getMovementHistory(variantId, storeId, limit = 50) {
        const db = getDb();
        const results = await db
            .select()
            .from(inventory_movements)
            .where(and(eq(inventory_movements.product_variant_id, variantId), eq(inventory_movements.store_id, storeId)))
            .orderBy(sql `${inventory_movements.created_at} DESC`)
            .limit(limit);
        return results;
    }
    /**
     * Check for low stock and return alerts
     */
    async checkLowStock(storeId, threshold = 10) {
        const db = getDb();
        // Get all variants with their stock levels
        const results = await db
            .select({
            id: product_variants.id,
            sku: product_variants.sku,
            stock_quantity: product_variants.stock_quantity,
        })
            .from(product_variants);
        const lowStockVariants = [];
        for (const variant of results) {
            const stockLevel = await this.getStockLevel(variant.id);
            if (stockLevel.available_stock <= threshold) {
                lowStockVariants.push(stockLevel);
            }
        }
        return lowStockVariants;
    }
    /**
     * Internal helper to add a movement record
     */
    async addMovement(variantId, storeId, type, quantity, reason, referenceId) {
        const db = getDb();
        await db.insert(inventory_movements).values({
            product_variant_id: variantId,
            store_id: storeId,
            type,
            quantity,
            reason: reason || null,
            reference_id: referenceId || null,
        });
    }
}
export const inventoryService = new InventoryService();
//# sourceMappingURL=inventory.service.js.map