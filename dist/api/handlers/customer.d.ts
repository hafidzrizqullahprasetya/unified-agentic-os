import { Context } from 'hono';
export declare function createCustomer(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        id: number;
        store_id: number;
        created_at: string;
        name: string;
        updated_at: string;
        metadata: import("hono/utils/types").JSONValue;
        city: string | null;
        province: string | null;
        postal_code: string | null;
        email: string | null;
        phone: string;
        address: string | null;
    };
}, any, "json">>;
export declare function getCustomer(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        id: number;
        store_id: number;
        created_at: string;
        name: string;
        updated_at: string;
        metadata: import("hono/utils/types").JSONValue;
        city: string | null;
        province: string | null;
        postal_code: string | null;
        email: string | null;
        phone: string;
        address: string | null;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
export declare function listCustomers(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        id: number;
        store_id: number;
        created_at: string;
        name: string;
        updated_at: string;
        metadata: import("hono/utils/types").JSONValue;
        city: string | null;
        province: string | null;
        postal_code: string | null;
        email: string | null;
        phone: string;
        address: string | null;
    }[];
    pagination: {
        limit: number;
        offset: number;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
export declare function updateCustomer(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        id: number;
        store_id: number;
        created_at: string;
        name: string;
        updated_at: string;
        metadata: import("hono/utils/types").JSONValue;
        city: string | null;
        province: string | null;
        postal_code: string | null;
        email: string | null;
        phone: string;
        address: string | null;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
export declare function deleteCustomer(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    message: string;
    data: {
        id: number;
        store_id: number;
        created_at: string;
        name: string;
        updated_at: string;
        metadata: import("hono/utils/types").JSONValue;
        city: string | null;
        province: string | null;
        postal_code: string | null;
        email: string | null;
        phone: string;
        address: string | null;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
//# sourceMappingURL=customer.d.ts.map