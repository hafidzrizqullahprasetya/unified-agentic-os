import { Context } from 'hono';
export declare function createProduct(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        name: string;
        description: string | null;
        id: number;
        is_active: boolean;
        created_at: string;
        updated_at: string;
        slug: string;
        store_id: number;
        price: string;
        cost_price: string | null;
        sku: string | null;
        category: string | null;
        image_urls: import("hono/utils/types").JSONValue;
    };
}, any, "json">>;
export declare function getProduct(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        name: string;
        description: string | null;
        id: number;
        is_active: boolean;
        created_at: string;
        updated_at: string;
        slug: string;
        store_id: number;
        price: string;
        cost_price: string | null;
        sku: string | null;
        category: string | null;
        image_urls: import("hono/utils/types").JSONValue;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
export declare function listProducts(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        name: string;
        description: string | null;
        id: number;
        is_active: boolean;
        created_at: string;
        updated_at: string;
        slug: string;
        store_id: number;
        price: string;
        cost_price: string | null;
        sku: string | null;
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
        name: string;
        description: string | null;
        id: number;
        is_active: boolean;
        created_at: string;
        updated_at: string;
        slug: string;
        store_id: number;
        price: string;
        cost_price: string | null;
        sku: string | null;
        category: string | null;
        image_urls: import("hono/utils/types").JSONValue;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
export declare function deleteProduct(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    message: string;
    data: {
        name: string;
        description: string | null;
        id: number;
        is_active: boolean;
        created_at: string;
        updated_at: string;
        slug: string;
        store_id: number;
        price: string;
        cost_price: string | null;
        sku: string | null;
        category: string | null;
        image_urls: import("hono/utils/types").JSONValue;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
export declare function searchProducts(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        name: string;
        description: string | null;
        id: number;
        is_active: boolean;
        created_at: string;
        updated_at: string;
        slug: string;
        store_id: number;
        price: string;
        cost_price: string | null;
        sku: string | null;
        category: string | null;
        image_urls: import("hono/utils/types").JSONValue;
    }[];
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
//# sourceMappingURL=product.d.ts.map