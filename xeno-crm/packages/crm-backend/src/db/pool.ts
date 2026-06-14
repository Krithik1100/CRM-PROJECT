import { Pool } from 'pg';
import { logger } from '../shared/utils/logger';

const databaseUrl = process.env.DATABASE_URL;
const requiresSsl = databaseUrl?.includes('sslmode=require') || databaseUrl?.includes('.neon.tech');

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: requiresSsl || process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle database client', { error: err.message });
});

pool.on('connect', () => {
  logger.debug('New database client connected');
});

export const query = async <T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { duration, rows: result.rowCount });
    return result.rows as T[];
  } catch (error) {
    logger.error('Database query error', { query: text, error });
    throw error;
  }
};

export const queryOne = async <T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> => {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
};

export const getClient = () => pool.connect();

export default pool;
