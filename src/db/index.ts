import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
  var _drizzleDb: NodePgDatabase<typeof schema> | undefined;
}

// Function to create or retrieve the connection pool lazily.
export const getPool = (): Pool => {
  if (!global._postgresPool) {
    if (!process.env.SQL_HOST) {
      throw new Error('SQL_HOST environment variable is not configured');
    }
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15000,
    });

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

// Initialize Drizzle with the pool and schema lazily.
export const getDb = () => {
  if (!global._drizzleDb) {
    const pool = getPool();
    global._drizzleDb = drizzle(pool, { schema });
  }
  return global._drizzleDb;
};

