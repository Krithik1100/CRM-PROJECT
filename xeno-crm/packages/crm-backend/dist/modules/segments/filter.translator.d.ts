export interface FilterCondition {
    field: string;
    op: string;
    value: unknown;
    subquery?: boolean;
}
export interface FilterJson {
    operator: 'AND' | 'OR';
    conditions: FilterCondition[];
}
/**
 * Translates AI-generated filter JSON into a safe parameterized SQL WHERE clause.
 * AI never directly generates SQL — this is the security boundary.
 */
export declare function filterJsonToSql(filterJson: FilterJson): {
    sql: string;
    params: unknown[];
};
//# sourceMappingURL=filter.translator.d.ts.map