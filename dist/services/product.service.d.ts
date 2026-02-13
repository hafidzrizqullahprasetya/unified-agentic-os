import type { CreateProductInput, UpdateProductInput } from '@/lib/validation';
export declare class ProductService {
    createProduct(storeId: number, data: CreateProductInput): Promise<{
        sku: string | null;
        id: number;
        store_id: number;
        created_at: Date;
        name: string;
        description: string | null;
        updated_at: Date;
        slug: string;
        is_active: boolean;
        price: string;
        cost_price: string | null;
        category: string | null;
        image_urls: unknown;
    }>;
    getProduct(storeId: number, productId: number): Promise<{
        sku: string | null;
        id: number;
        store_id: number;
        created_at: Date;
        name: string;
        description: string | null;
        updated_at: Date;
        slug: string;
        is_active: boolean;
        price: string;
        cost_price: string | null;
        category: string | null;
        image_urls: unknown;
    }>;
    listProducts(storeId: number, limit?: number, offset?: number): Promise<{
        sku: string | null;
        id: number;
        store_id: number;
        created_at: Date;
        name: string;
        description: string | null;
        updated_at: Date;
        slug: string;
        is_active: boolean;
        price: string;
        cost_price: string | null;
        category: string | null;
        image_urls: unknown;
    }[]>;
    updateProduct(storeId: number, productId: number, data: UpdateProductInput): Promise<{
        sku: string | null;
        id: number;
        store_id: number;
        created_at: Date;
        name: string;
        description: string | null;
        updated_at: Date;
        slug: string;
        is_active: boolean;
        price: string;
        cost_price: string | null;
        category: string | null;
        image_urls: unknown;
    }>;
    deleteProduct(storeId: number, productId: number): Promise<{
        sku: string | null;
        id: number;
        store_id: number;
        created_at: Date;
        name: string;
        description: string | null;
        updated_at: Date;
        slug: string;
        is_active: boolean;
        price: string;
        cost_price: string | null;
        category: string | null;
        image_urls: unknown;
    }>;
    searchProducts(storeId: number, query: string, limit?: number): Promise<{
        sku: string | null;
        id: number;
        store_id: number;
        created_at: Date;
        name: string;
        description: string | null;
        updated_at: Date;
        slug: string;
        is_active: boolean;
        price: string;
        cost_price: string | null;
        category: string | null;
        image_urls: unknown;
    }[]>;
    private generateSlug;
}
export declare function createProductService(): ProductService;
//# sourceMappingURL=product.service.d.ts.map