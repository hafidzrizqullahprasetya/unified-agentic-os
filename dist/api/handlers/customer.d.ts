import { Context } from 'hono';
export declare function createCustomer(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        name: string;
        id: number;
        email: string | null;
        phone: string;
        created_at: string;
        updated_at: string;
        city: string | null;
        province: string | null;
        postal_code: string | null;
        store_id: number;
        address: string | null;
        metadata: import("hono/utils/types").JSONValue;
    };
}, any, "json">>;
export declare function getCustomer(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        name: string;
        id: number;
        email: string | null;
        phone: string;
        created_at: string;
        updated_at: string;
        city: string | null;
        province: string | null;
        postal_code: string | null;
        store_id: number;
        address: string | null;
        metadata: import("hono/utils/types").JSONValue;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
export declare function listCustomers(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        name: string;
        id: number;
        email: string | null;
        phone: string;
        created_at: string;
        updated_at: string;
        city: string | null;
        province: string | null;
        postal_code: string | null;
        store_id: number;
        address: string | null;
        metadata: import("hono/utils/types").JSONValue;
    }[];
    pagination: {
        limit: number;
        offset: number;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
export declare function updateCustomer(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        name: string;
        id: number;
        email: string | null;
        phone: string;
        created_at: string;
        updated_at: string;
        city: string | null;
        province: string | null;
        postal_code: string | null;
        store_id: number;
        address: string | null;
        metadata: import("hono/utils/types").JSONValue;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
export declare function deleteCustomer(c: Context): Promise<Response & import("hono").TypedResponse<{
    success: true;
    message: string;
    data: {
        name: string;
        id: number;
        email: string | null;
        phone: string;
        created_at: string;
        updated_at: string;
        city: string | null;
        province: string | null;
        postal_code: string | null;
        store_id: number;
        address: string | null;
        metadata: import("hono/utils/types").JSONValue;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
//# sourceMappingURL=customer.d.ts.map