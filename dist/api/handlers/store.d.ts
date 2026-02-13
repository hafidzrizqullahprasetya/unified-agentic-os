import { Context } from 'hono';
export declare function createStore(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        name: string;
        description: string | null;
        id: number;
        is_active: boolean;
        created_at: string;
        updated_at: string;
        user_id: number;
        slug: string;
        logo_url: string | null;
        banner_url: string | null;
        city: string | null;
        province: string | null;
        postal_code: string | null;
    };
}, any, "json">>;
export declare function getStore(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        name: string;
        description: string | null;
        id: number;
        is_active: boolean;
        created_at: string;
        updated_at: string;
        user_id: number;
        slug: string;
        logo_url: string | null;
        banner_url: string | null;
        city: string | null;
        province: string | null;
        postal_code: string | null;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
export declare function getStoreBySlug(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        name: string;
        description: string | null;
        id: number;
        is_active: boolean;
        created_at: string;
        updated_at: string;
        user_id: number;
        slug: string;
        logo_url: string | null;
        banner_url: string | null;
        city: string | null;
        province: string | null;
        postal_code: string | null;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
export declare function getUserStores(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        name: string;
        description: string | null;
        id: number;
        is_active: boolean;
        created_at: string;
        updated_at: string;
        user_id: number;
        slug: string;
        logo_url: string | null;
        banner_url: string | null;
        city: string | null;
        province: string | null;
        postal_code: string | null;
    }[];
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
export declare function updateStore(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        name: string;
        description: string | null;
        id: number;
        is_active: boolean;
        created_at: string;
        updated_at: string;
        user_id: number;
        slug: string;
        logo_url: string | null;
        banner_url: string | null;
        city: string | null;
        province: string | null;
        postal_code: string | null;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
export declare function deleteStore(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    message: string;
    data: {
        name: string;
        description: string | null;
        id: number;
        is_active: boolean;
        created_at: string;
        updated_at: string;
        user_id: number;
        slug: string;
        logo_url: string | null;
        banner_url: string | null;
        city: string | null;
        province: string | null;
        postal_code: string | null;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
//# sourceMappingURL=store.d.ts.map