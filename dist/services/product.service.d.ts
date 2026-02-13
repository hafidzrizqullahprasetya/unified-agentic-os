import type { CreateProductInput, UpdateProductInput } from '@/lib/validation';
export declare class ProductService {
    createProduct(storeId: number, data: CreateProductInput): Promise<{
        name: string;
        description: string | null;
        id: number;
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
        slug: string;
        store_id: number;
        price: string;
        cost_price: string | null;
        sku: string | null;
        category: string | null;
        image_urls: unknown;
    }>;
    getProduct(storeId: number, productId: number): Promise<{
        name: string;
        description: string | null;
        id: number;
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
        slug: string;
        store_id: number;
        price: string;
        cost_price: string | null;
        sku: string | null;
        category: string | null;
        image_urls: unknown;
    }>;
    listProducts(storeId: number, limit?: number, offset?: number): Promise<{
        name: string;
        description: string | null;
        id: number;
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
        slug: string;
        store_id: number;
        price: string;
        cost_price: string | null;
        sku: string | null;
        category: string | null;
        image_urls: unknown;
    }[]>;
    updateProduct(storeId: number, productId: number, data: UpdateProductInput): Promise<{
        name: string;
        description: string | null;
        id: number;
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
        slug: string;
        store_id: number;
        price: string;
        cost_price: string | null;
        sku: string | null;
        category: string | null;
        image_urls: unknown;
    }>;
    deleteProduct(storeId: number, productId: number): Promise<{
        name: string;
        description: string | null;
        id: number;
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
        slug: string;
        store_id: number;
        price: string;
        cost_price: string | null;
        sku: string | null;
        category: string | null;
        image_urls: unknown;
    }>;
    searchProducts(storeId: number, query: string, limit?: number): Promise<{
        name: string;
        description: string | null;
        id: number;
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
        slug: string;
        store_id: number;
        price: string;
        cost_price: string | null;
        sku: string | null;
        category: string | null;
        image_urls: unknown;
    }[]>;
    private generateSlug;
}
export declare function createProductService(): ProductService;
//# sourceMappingURL=product.service.d.ts.map