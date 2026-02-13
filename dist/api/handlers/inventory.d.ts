import { Context } from "hono";
/**
 * GET /api/stores/:storeId/inventory/products/:variantId
 * Get current stock level and reservations for a product variant
 */
export declare function getInventoryHandler(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        stock_level: {
            variant_id: number;
            sku: string;
            current_stock: number;
            reserved_quantity: number;
            available_stock: number;
        };
        active_reservations: {
            id: number;
            order_id: number;
            product_variant_id: number;
            quantity: number;
            reserved_at: string;
            released_at: string | null;
        }[];
    };
}, 200, "json">>;
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
export declare function reserveStockHandler(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        reservations: {
            id: number;
            order_id: number;
            product_variant_id: number;
            quantity: number;
            reserved_at: string;
            released_at: string | null;
        }[];
        message: string;
    };
}, 201, "json">>;
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
export declare function adjustInventoryHandler(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        message: string;
    };
}, 200, "json">>;
/**
 * GET /api/stores/:storeId/inventory/movements
 * View inventory movement history
 *
 * Query params:
 * - variant_id: number (required)
 * - limit: number (optional, default 50)
 */
export declare function getMovementsHandler(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        movements: {
            id: number;
            product_variant_id: number;
            store_id: number;
            type: string;
            quantity: number;
            reason: string | null;
            reference_id: string | null;
            created_at: string;
        }[];
        count: number;
    };
}, 200, "json">>;
/**
 * POST /api/stores/:storeId/inventory/release/:reservationId
 * Release/cancel a reservation
 */
export declare function releaseReservationHandler(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        message: string;
    };
}, 200, "json">>;
/**
 * GET /api/stores/:storeId/inventory/low-stock
 * Check for low stock items
 *
 * Query params:
 * - threshold: number (optional, default 10)
 */
export declare function checkLowStockHandler(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        low_stock_items: {
            variant_id: number;
            sku: string;
            current_stock: number;
            reserved_quantity: number;
            available_stock: number;
        }[];
        count: number;
        threshold: number;
    };
}, 200, "json">>;
//# sourceMappingURL=inventory.d.ts.map