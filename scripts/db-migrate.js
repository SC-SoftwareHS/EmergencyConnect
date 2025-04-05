/**
 * Database migration script for the Emergency Alert System
 * This script uses drizzle-kit to push schema changes to the PostgreSQL database
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ensure environment variables are loaded
require('dotenv').config();

// Verify database connection string
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

console.log('Starting database migration...');

try {
  // Run Drizzle Kit Push command
  console.log('Pushing schema changes to the database...');
  execSync('npx drizzle-kit push:pg', { stdio: 'inherit' });

  console.log('Database migration completed successfully!');
} catch (error) {
  console.error('Database migration failed:', error.message);
  process.exit(1);
}