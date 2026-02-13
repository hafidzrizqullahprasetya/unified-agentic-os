import { Context } from 'hono';
export declare function createStore(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        id: number;
        created_at: string;
        name: string;
        description: string | null;
        updated_at: string;
        user_id: number;
        slug: string;
        logo_url: string | null;
        banner_url: string | null;
        city: string | null;
        province: string | null;
        postal_code: string | null;
        is_active: boolean;
    };
}, any, "json">>;
export declare function getStore(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        id: number;
        created_at: string;
        name: string;
        description: string | null;
        updated_at: string;
        user_id: number;
        slug: string;
        logo_url: string | null;
        banner_url: string | null;
        city: string | null;
        province: string | null;
        postal_code: string | null;
        is_active: boolean;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
export declare function getStoreBySlug(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        id: number;
        created_at: string;
        name: string;
        description: string | null;
        updated_at: string;
        user_id: number;
        slug: string;
        logo_url: string | null;
        banner_url: string | null;
        city: string | null;
        province: string | null;
        postal_code: string | null;
        is_active: boolean;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
export declare function getUserStores(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        id: number;
        created_at: string;
        name: string;
        description: string | null;
        updated_at: string;
        user_id: number;
        slug: string;
        logo_url: string | null;
        banner_url: string | null;
        city: string | null;
        province: string | null;
        postal_code: string | null;
        is_active: boolean;
    }[];
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
export declare function updateStore(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        id: number;
        created_at: string;
        name: string;
        description: string | null;
        updated_at: string;
        user_id: number;
        slug: string;
        logo_url: string | null;
        banner_url: string | null;
        city: string | null;
        province: string | null;
        postal_code: string | null;
        is_active: boolean;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
export declare function deleteStore(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    message: string;
    data: {
        id: number;
        created_at: string;
        name: string;
        description: string | null;
        updated_at: string;
        user_id: number;
        slug: string;
        logo_url: string | null;
        banner_url: string | null;
        city: string | null;
        province: string | null;
        postal_code: string | null;
        is_active: boolean;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
//# sourceMappingURL=store.d.ts.map