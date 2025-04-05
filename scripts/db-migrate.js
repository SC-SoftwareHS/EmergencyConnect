/**
 * Database migration script for the Emergency Alert System
 * This script uses drizzle-kit to push schema changes to the PostgreSQL database
 */
const { exec } = require('child_process');
const path = require('path');

console.log('Starting database migration...');

// Execute drizzle-kit push:pg to apply schema changes
exec('npx drizzle-kit push:pg', (error, stdout, stderr) => {
  if (error) {
    console.error('Error during migration:', error);
    return;
  }
  
  console.log('Migration stdout:', stdout);
  
  if (stderr) {
    console.error('Migration stderr:', stderr);
  }
  
  console.log('Database migration completed successfully');
});