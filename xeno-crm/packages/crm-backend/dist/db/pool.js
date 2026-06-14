"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClient = exports.queryOne = exports.query = void 0;
const pg_1 = require("pg");
const logger_1 = require("../shared/utils/logger");
const databaseUrl = process.env.DATABASE_URL;
const requiresSsl = databaseUrl?.includes('sslmode=require') || databaseUrl?.includes('.neon.tech');
const pool = new pg_1.Pool({
    connectionString: databaseUrl,
    ssl: requiresSsl || process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});
pool.on('error', (err) => {
    logger_1.logger.error('Unexpected error on idle database client', { error: err.message });
});
pool.on('connect', () => {
    logger_1.logger.debug('New database client connected');
});
const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        logger_1.logger.debug('Executed query', { duration, rows: result.rowCount });
        return result.rows;
    }
    catch (error) {
        logger_1.logger.error('Database query error', { query: text, error });
        throw error;
    }
};
exports.query = query;
const queryOne = async (text, params) => {
    const rows = await (0, exports.query)(text, params);
    return rows[0] ?? null;
};
exports.queryOne = queryOne;
const getClient = () => pool.connect();
exports.getClient = getClient;
exports.default = pool;
//# sourceMappingURL=pool.js.map