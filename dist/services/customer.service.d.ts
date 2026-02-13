import type { CreateCustomerInput, UpdateCustomerInput } from '@/lib/validation';
export declare class CustomerService {
    createCustomer(storeId: number, data: CreateCustomerInput): Promise<{
        name: string;
        id: number;
        email: string | null;
        phone: string;
        created_at: Date;
        updated_at: Date;
        city: string | null;
        province: string | null;
        postal_code: string | null;
        store_id: number;
        address: string | null;
        metadata: unknown;
    }>;
    getCustomer(storeId: number, customerId: number): Promise<{
        name: string;
        id: number;
        email: string | null;
        phone: string;
        created_at: Date;
        updated_at: Date;
        city: string | null;
        province: string | null;
        postal_code: string | null;
        store_id: number;
        address: string | null;
        metadata: unknown;
    }>;
    listCustomers(storeId: number, limit?: number, offset?: number): Promise<{
        name: string;
        id: number;
        email: string | null;
        phone: string;
        created_at: Date;
        updated_at: Date;
        city: string | null;
        province: string | null;
        postal_code: string | null;
        store_id: number;
        address: string | null;
        metadata: unknown;
    }[]>;
    updateCustomer(storeId: number, customerId: number, data: UpdateCustomerInput): Promise<{
        name: string;
        id: number;
        email: string | null;
        phone: string;
        created_at: Date;
        updated_at: Date;
        city: string | null;
        province: string | null;
        postal_code: string | null;
        store_id: number;
        address: string | null;
        metadata: unknown;
    }>;
    deleteCustomer(storeId: number, customerId: number): Promise<{
        name: string;
        id: number;
        email: string | null;
        phone: string;
        created_at: Date;
        updated_at: Date;
        city: string | null;
        province: string | null;
        postal_code: string | null;
        store_id: number;
        address: string | null;
        metadata: unknown;
    }>;
    getCustomerByPhone(storeId: number, phone: string): Promise<{
        name: string;
        id: number;
        email: string | null;
        phone: string;
        created_at: Date;
        updated_at: Date;
        city: string | null;
        province: string | null;
        postal_code: string | null;
        store_id: number;
        address: string | null;
        metadata: unknown;
    } | null>;
}
export declare function createCustomerService(): CustomerService;
//# sourceMappingURL=customer.service.d.ts.map