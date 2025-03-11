import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Check that we have all the required database environment variables
if (!process.env.PGHOST || !process.env.PGUSER || !process.env.PGPASSWORD || !process.env.PGDATABASE) {
  throw new Error(
    "Database connection environment variables missing. Did you forget to provision a database?",
  );
}

// Create a pg Pool with explicit connection parameters
export const pool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: {
    rejectUnauthorized: false // needed for self-signed certs
  }
});

// Initialize drizzle with the pool and schema
export const db = drizzle(pool, { schema });
