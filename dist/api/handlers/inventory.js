import { inventoryService } from "@/services/inventory.service";
import { ValidationError } from "@/lib/errors";
import { z } from "zod";
/**
 * GET /api/stores/:storeId/inventory/products/:variantId
 * Get current stock level and reservations for a product variant
 */
export async function getInventoryHandler(c) {
    try {
        const storeId = c.req.param("storeId");
        const variantId = c.req.param("variantId");
        // Validate inputs
        if (!storeId || !variantId) {
            throw new ValidationError("Missing required parameters: storeId, variantId");
        }
        const variantIdNum = parseInt(variantId, 10);
        if (isNaN(variantIdNum)) {
            throw new ValidationError("variantId must be a valid number");
        }
        // Get stock level
        const stockLevel = await inventoryService.getStockLevel(variantIdNum);
        // Get reservations for this variant
        const reservations = await inventoryService.getOrderReservations(parseInt(variantId, 10));
        return c.json({
            success: true,
            data: {
                stock_level: stockLevel,
                active_reservations: reservations.filter((r) => !r.released_at),
            },
        }, 200);
    }
    catch (error) {
        throw error;
    }
}
/**
 * POST /api/stores/:storeId/inventory/reserve
 * Reserve stock for an order
 *
 * Body:
 * {
 *   "order_id": 123,
 *   "items": [
 *     { "product_variant_id": 10, "quantity": 2 },
 *     { "product_variant_id": 11, "quantity": 1 }
 *   ]
 * }
 */
export async function reserveStockHandler(c) {
    try {
        const storeId = c.req.param("storeId");
        if (!storeId) {
            throw new ValidationError("Missing required parameter: storeId");
        }
        const storeIdNum = parseInt(storeId, 10);
        if (isNaN(storeIdNum)) {
            throw new ValidationError("storeId must be a valid number");
        }
        // Parse and validate request body
        const body = await c.req.json();
        const reserveSchema = z.object({
            order_id: z
                .number()
                .int()
                .positive("Order ID must be a positive integer"),
            items: z.array(z.object({
                product_variant_id: z
                    .number()
                    .int()
                    .positive("Variant ID must be a positive integer"),
                quantity: z
                    .number()
                    .int()
                    .positive("Quantity must be a positive integer"),
            })),
        });
        const validated = reserveSchema.parse(body);
        // Reserve stock
        const reservations = await inventoryService.reserveStock(validated.order_id, validated.items, storeIdNum);
        return c.json({
            success: true,
            data: {
                reservations,
                message: `Successfully reserved stock for ${reservations.length} items`,
            },
        }, 201);
    }
    catch (error) {
        throw error;
    }
}
/**
 * POST /api/stores/:storeId/inventory/adjust
 * Manually adjust inventory stock (admin only)
 *
 * Body:
 * {
 *   "product_variant_id": 10,
 *   "quantity_change": 5,
 *   "reason": "stock_correction"
 * }
 */
export async function adjustInventoryHandler(c) {
    try {
        const storeId = c.req.param("storeId");
        if (!storeId) {
            throw new ValidationError("Missing required parameter: storeId");
        }
        const storeIdNum = parseInt(storeId, 10);
        if (isNaN(storeIdNum)) {
            throw new ValidationError("storeId must be a valid number");
        }
        // Parse and validate request body
        const body = await c.req.json();
        const adjustSchema = z.object({
            product_variant_id: z
                .number()
                .int()
                .positive("Variant ID must be a positive integer"),
            quantity_change: z
                .number()
                .int()
                .refine((n) => n !== 0, "Quantity change cannot be zero"),
            reason: z.string().min(1, "Reason is required"),
        });
        const validated = adjustSchema.parse(body);
        const quantityChange = validated.quantity_change;
        // Adjust stock
        await inventoryService.adjustStock(validated.product_variant_id, storeIdNum, quantityChange, validated.reason);
        return c.json({
            success: true,
            data: {
                message: `Inventory adjusted by ${quantityChange} units`,
            },
        }, 200);
    }
    catch (error) {
        throw error;
    }
}
/**
 * GET /api/stores/:storeId/inventory/movements
 * View inventory movement history
 *
 * Query params:
 * - variant_id: number (required)
 * - limit: number (optional, default 50)
 */
export async function getMovementsHandler(c) {
    try {
        const storeId = c.req.param("storeId");
        const variantId = c.req.query("variant_id");
        const limitStr = c.req.query("limit");
        if (!storeId) {
            throw new ValidationError("Missing required parameter: storeId");
        }
        if (!variantId) {
            throw new ValidationError("Missing required query parameter: variant_id");
        }
        const storeIdNum = parseInt(storeId, 10);
        const variantIdNum = parseInt(variantId, 10);
        const limit = limitStr ? parseInt(limitStr, 10) : 50;
        if (isNaN(storeIdNum) || isNaN(variantIdNum) || isNaN(limit)) {
            throw new ValidationError("storeId, variant_id, and limit must be valid numbers");
        }
        if (limit < 1 || limit > 500) {
            throw new ValidationError("Limit must be between 1 and 500");
        }
        // Get movement history
        const movements = await inventoryService.getMovementHistory(variantIdNum, storeIdNum, limit);
        return c.json({
            success: true,
            data: {
                movements,
                count: movements.length,
            },
        }, 200);
    }
    catch (error) {
        throw error;
    }
}
/**
 * POST /api/stores/:storeId/inventory/release/:reservationId
 * Release/cancel a reservation
 */
export async function releaseReservationHandler(c) {
    try {
        const storeId = c.req.param("storeId");
        const reservationId = c.req.param("reservationId");
        if (!storeId || !reservationId) {
            throw new ValidationError("Missing required parameters: storeId, reservationId");
        }
        const storeIdNum = parseInt(storeId, 10);
        const reservationIdNum = parseInt(reservationId, 10);
        if (isNaN(storeIdNum) || isNaN(reservationIdNum)) {
            throw new ValidationError("storeId and reservationId must be valid numbers");
        }
        // Release reservation
        await inventoryService.releaseReservation(reservationIdNum, storeIdNum);
        return c.json({
            success: true,
            data: {
                message: `Reservation ${reservationIdNum} has been released`,
            },
        }, 200);
    }
    catch (error) {
        throw error;
    }
}
/**
 * GET /api/stores/:storeId/inventory/low-stock
 * Check for low stock items
 *
 * Query params:
 * - threshold: number (optional, default 10)
 */
export async function checkLowStockHandler(c) {
    try {
        const storeId = c.req.param("storeId");
        const thresholdStr = c.req.query("threshold");
        if (!storeId) {
            throw new ValidationError("Missing required parameter: storeId");
        }
        const storeIdNum = parseInt(storeId, 10);
        const threshold = thresholdStr ? parseInt(thresholdStr, 10) : 10;
        if (isNaN(storeIdNum) || isNaN(threshold)) {
            throw new ValidationError("storeId and threshold must be valid numbers");
        }
        if (threshold < 0) {
            throw new ValidationError("Threshold must be a non-negative number");
        }
        // Get low stock items
        const lowStockItems = await inventoryService.checkLowStock(storeIdNum, threshold);
        return c.json({
            success: true,
            data: {
                low_stock_items: lowStockItems,
                count: lowStockItems.length,
                threshold,
            },
        }, 200);
    }
    catch (error) {
        throw error;
    }
}
//# sourceMappingURL=inventory.js.map