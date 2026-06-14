import { Pool } from 'pg';
declare const pool: Pool;
export declare const query: <T = Record<string, unknown>>(text: string, params?: unknown[]) => Promise<T[]>;
export declare const queryOne: <T = Record<string, unknown>>(text: string, params?: unknown[]) => Promise<T | null>;
export declare const getClient: () => Promise<import("pg").PoolClient>;
export default pool;
//# sourceMappingURL=pool.d.ts.map