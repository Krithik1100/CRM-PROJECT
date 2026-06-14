import { FilterJson } from './filter.translator';
export declare const segmentService: {
    listSegments(): Promise<import("./segment.repository").Segment[]>;
    getSegment(id: string): Promise<import("./segment.repository").Segment>;
    aiQuery(naturalLanguageQuery: string): Promise<{
        customerCount: number;
        customerSample: import("../customers/customer.types").Customer[];
        filterJson: object;
        segmentName: string;
        description: string;
        sqlPreview: string;
    }>;
    createSegment(data: {
        name: string;
        description?: string;
        filter_json: FilterJson;
        ai_query?: string;
    }): Promise<import("./segment.repository").Segment>;
    getSegmentCustomers(id: string): Promise<{
        customers: import("../customers/customer.types").Customer[];
        count: number;
    }>;
};
//# sourceMappingURL=segment.service.d.ts.map