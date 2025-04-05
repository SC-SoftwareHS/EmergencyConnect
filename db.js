/**
 * Database connection configuration for the Emergency Alert System
 * Uses PostgreSQL with Drizzle ORM
 */
const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const schema = require('./shared/schema');

// Create PostgreSQL connection pool using environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize Drizzle with our pool and schema
const db = drizzle(pool, { schema });

// Export the db instance for use throughout the application
module.exports = { db, pool };