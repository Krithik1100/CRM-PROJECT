import { FilterJson } from './filter.translator';
import { Customer } from '../customers/customer.types';
export interface Segment {
    id: string;
    name: string;
    description?: string;
    filter_json: FilterJson;
    ai_query?: string;
    customer_count: number;
    last_computed_at?: string;
    created_at: string;
    updated_at: string;
}
export declare const segmentRepository: {
    findAll(): Promise<Segment[]>;
    findById(id: string): Promise<Segment | null>;
    create(data: {
        name: string;
        description?: string;
        filter_json: FilterJson;
        ai_query?: string;
        customer_count: number;
    }): Promise<Segment>;
    computeCustomers(filterJson: FilterJson): Promise<{
        customers: Customer[];
        count: number;
    }>;
    refreshCount(segmentId: string, filterJson: FilterJson): Promise<number>;
    getCustomerIds(filterJson: FilterJson): Promise<string[]>;
};
//# sourceMappingURL=segment.repository.d.ts.map