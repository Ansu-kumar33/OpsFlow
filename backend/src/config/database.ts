import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'opsflow',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

export { pool };

export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    await pool.query('SELECT 1');
    console.log('PostgreSQL connected successfully');
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    console.error('PostgreSQL connection failed:', message);
    return false;
  }
};
