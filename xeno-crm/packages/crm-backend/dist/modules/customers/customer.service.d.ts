import { CustomerListQuery } from './customer.types';
export declare const customerService: {
    listCustomers(query: CustomerListQuery): Promise<{
        customers: import("./customer.types").Customer[];
        total: number;
    }>;
    getCustomer(id: string): Promise<{
        orders: import("./customer.types").Order[];
        id: string;
        external_id?: string;
        name: string;
        email?: string;
        phone?: string;
        city?: string;
        tier: "bronze" | "silver" | "gold";
        total_spent: number;
        order_count: number;
        first_order_at?: string;
        last_order_at?: string;
        created_at: string;
        updated_at: string;
    }>;
    getStats(): Promise<{
        total: number;
        gold: number;
        silver: number;
        bronze: number;
        avg_spent: number;
    }>;
    seedData(count?: number): Promise<{
        seeded: boolean;
        reset: boolean;
        dataset: string;
        count: number;
    }>;
};
//# sourceMappingURL=customer.service.d.ts.map