import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

import pool from './pool';

async function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  
  const client = await pool.connect();
  try {
    console.log('Running database migrations...');
    await client.query(schema);
    console.log('✅ Database schema applied successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
