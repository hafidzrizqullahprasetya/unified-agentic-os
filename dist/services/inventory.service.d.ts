export interface StockLevel {
    variant_id: number;
    sku: string;
    current_stock: number;
    reserved_quantity: number;
    available_stock: number;
}
export interface Reservation {
    id: number;
    order_id: number;
    product_variant_id: number;
    quantity: number;
    reserved_at: Date;
    released_at: Date | null;
}
export interface MovementRecord {
    id: number;
    product_variant_id: number;
    store_id: number;
    type: string;
    quantity: number;
    reason: string | null;
    reference_id: string | null;
    created_at: Date;
}
export declare class InventoryService {
    /**
     * Get current stock level for a product variant
     * Calculates: current_stock, reserved_quantity, available_stock
     */
    getStockLevel(variantId: number): Promise<StockLevel>;
    /**
     * Reserve stock for an order
     * Creates inventory reservations for each order item
     */
    reserveStock(orderId: number, items: Array<{
        product_variant_id: number;
        quantity: number;
    }>, storeId: number): Promise<Reservation[]>;
    /**
     * Release a reservation (when order is cancelled)
     */
    releaseReservation(reservationId: number, storeId: number): Promise<void>;
    /**
     * Manually adjust inventory stock
     * Used for stock corrections, returns, damages, etc.
     */
    adjustStock(variantId: number, storeId: number, quantityChange: number, reason: string, createdById?: number): Promise<void>;
    /**
     * Get all reservations for an order
     */
    getOrderReservations(orderId: number): Promise<Reservation[]>;
    /**
     * Get movement history for a variant
     */
    getMovementHistory(variantId: number, storeId: number, limit?: number): Promise<MovementRecord[]>;
    /**
     * Check for low stock and return alerts
     */
    checkLowStock(storeId: number, threshold?: number): Promise<StockLevel[]>;
    /**
     * Internal helper to add a movement record
     */
    private addMovement;
}
export declare const inventoryService: InventoryService;
//# sourceMappingURL=inventory.service.d.ts.map