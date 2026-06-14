import { Customer, Order, CustomerListQuery } from './customer.types';
export declare const customerRepository: {
    resetDemoData(): Promise<void>;
    findAll(options: CustomerListQuery): Promise<{
        customers: Customer[];
        total: number;
    }>;
    findById(id: string): Promise<Customer | null>;
    findOrdersByCustomerId(customerId: string): Promise<Order[]>;
    insertCustomer(customer: Omit<Customer, "id" | "created_at" | "updated_at" | "total_spent" | "order_count">): Promise<Customer>;
    insertOrder(order: Omit<Order, "id" | "created_at">): Promise<Order>;
    getStats(): Promise<{
        total: number;
        gold: number;
        silver: number;
        bronze: number;
        avg_spent: number;
    }>;
};
//# sourceMappingURL=customer.repository.d.ts.map