import type { CreateCustomerInput, UpdateCustomerInput } from '@/lib/validation';
export declare class CustomerService {
    createCustomer(storeId: number, data: CreateCustomerInput): Promise<{
        id: number;
        store_id: number;
        created_at: Date;
        name: string;
        updated_at: Date;
        metadata: unknown;
        city: string | null;
        province: string | null;
        postal_code: string | null;
        email: string | null;
        phone: string;
        address: string | null;
    }>;
    getCustomer(storeId: number, customerId: number): Promise<{
        id: number;
        store_id: number;
        created_at: Date;
        name: string;
        updated_at: Date;
        metadata: unknown;
        city: string | null;
        province: string | null;
        postal_code: string | null;
        email: string | null;
        phone: string;
        address: string | null;
    }>;
    listCustomers(storeId: number, limit?: number, offset?: number): Promise<{
        id: number;
        store_id: number;
        created_at: Date;
        name: string;
        updated_at: Date;
        metadata: unknown;
        city: string | null;
        province: string | null;
        postal_code: string | null;
        email: string | null;
        phone: string;
        address: string | null;
    }[]>;
    updateCustomer(storeId: number, customerId: number, data: UpdateCustomerInput): Promise<{
        id: number;
        store_id: number;
        created_at: Date;
        name: string;
        updated_at: Date;
        metadata: unknown;
        city: string | null;
        province: string | null;
        postal_code: string | null;
        email: string | null;
        phone: string;
        address: string | null;
    }>;
    deleteCustomer(storeId: number, customerId: number): Promise<{
        id: number;
        store_id: number;
        created_at: Date;
        name: string;
        updated_at: Date;
        metadata: unknown;
        city: string | null;
        province: string | null;
        postal_code: string | null;
        email: string | null;
        phone: string;
        address: string | null;
    }>;
    getCustomerByPhone(storeId: number, phone: string): Promise<{
        id: number;
        store_id: number;
        created_at: Date;
        name: string;
        updated_at: Date;
        metadata: unknown;
        city: string | null;
        province: string | null;
        postal_code: string | null;
        email: string | null;
        phone: string;
        address: string | null;
    } | null>;
}
export declare function createCustomerService(): CustomerService;
//# sourceMappingURL=customer.service.d.ts.map