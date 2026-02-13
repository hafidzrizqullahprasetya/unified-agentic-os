import { Context } from 'hono';
export declare function createProduct(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        sku: string | null;
        id: number;
        store_id: number;
        created_at: string;
        name: string;
        description: string | null;
        updated_at: string;
        slug: string;
        is_active: boolean;
        price: string;
        cost_price: string | null;
        category: string | null;
        image_urls: import("hono/utils/types").JSONValue;
    };
}, any, "json">>;
export declare function getProduct(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        sku: string | null;
        id: number;
        store_id: number;
        created_at: string;
        name: string;
        description: string | null;
        updated_at: string;
        slug: string;
        is_active: boolean;
        price: string;
        cost_price: string | null;
        category: string | null;
        image_urls: import("hono/utils/types").JSONValue;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
export declare function listProducts(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        sku: string | null;
        id: number;
        store_id: number;
        created_at: string;
        name: string;
        description: string | null;
        updated_at: string;
        slug: string;
        is_active: boolean;
        price: string;
        cost_price: string | null;
        category: string | null;
        image_urls: import("hono/utils/types").JSONValue;
    }[];
    pagination: {
        limit: number;
        offset: number;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
export declare function updateProduct(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        sku: string | null;
        id: number;
        store_id: number;
        created_at: string;
        name: string;
        description: string | null;
        updated_at: string;
        slug: string;
        is_active: boolean;
        price: string;
        cost_price: string | null;
        category: string | null;
        image_urls: import("hono/utils/types").JSONValue;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
export declare function deleteProduct(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    message: string;
    data: {
        sku: string | null;
        id: number;
        store_id: number;
        created_at: string;
        name: string;
        description: string | null;
        updated_at: string;
        slug: string;
        is_active: boolean;
        price: string;
        cost_price: string | null;
        category: string | null;
        image_urls: import("hono/utils/types").JSONValue;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
export declare function searchProducts(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        sku: string | null;
        id: number;
        store_id: number;
        created_at: string;
        name: string;
        description: string | null;
        updated_at: string;
        slug: string;
        is_active: boolean;
        price: string;
        cost_price: string | null;
        category: string | null;
        image_urls: import("hono/utils/types").JSONValue;
    }[];
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
//# sourceMappingURL=product.d.ts.map