/**
 * Database initialization script for the Emergency Alert System
 * This script uses Drizzle ORM to create the initial database structure and seed data
 */
require('dotenv').config();
const { db } = require('../db');
const schema = require('../shared/schema');
const { eq } = require('drizzle-orm');
const { scrypt, randomBytes } = require('crypto');
const { promisify } = require('util');

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function initializeDatabase() {
  try {
    console.log('Starting database initialization...');
    
    // Check if admin user exists
    const existingAdmin = await db.select().from(schema.users).where(eq(schema.users.username, 'admin')).limit(1);
    
    if (existingAdmin.length === 0) {
      console.log('Creating admin user...');
      
      // Create admin user
      const adminPassword = await hashPassword('admin123');
      const [admin] = await db.insert(schema.users).values({
        username: 'admin',
        email: 'admin@example.com',
        password: adminPassword,
        role: 'admin',
        channels: { email: true, sms: true, push: false }
      }).returning();
      
      console.log('Admin user created with ID:', admin.id);
      
      // Create operator user
      const operatorPassword = await hashPassword('operator123');
      const [operator] = await db.insert(schema.users).values({
        username: 'operator',
        email: 'operator@example.com',
        password: operatorPassword,
        role: 'operator',
        channels: { email: true, sms: false, push: false }
      }).returning();
      
      console.log('Operator user created with ID:', operator.id);
      
      // Create subscriber user
      const userPassword = await hashPassword('user123');
      const [user] = await db.insert(schema.users).values({
        username: 'user',
        email: 'user@example.com',
        password: userPassword,
        role: 'subscriber',
        channels: { email: true, sms: false, push: false }
      }).returning();
      
      console.log('Subscriber user created with ID:', user.id);
      
      // Create subscriptions for the users
      await db.insert(schema.subscriptions).values({
        userId: admin.id,
        categories: ['emergency', 'system', 'severe']
      });
      
      await db.insert(schema.subscriptions).values({
        userId: operator.id,
        categories: ['emergency', 'severe']
      });
      
      await db.insert(schema.subscriptions).values({
        userId: user.id,
        categories: ['emergency']
      });
      
      console.log('User subscriptions created');
      
      // Create a sample alert
      const [alert] = await db.insert(schema.alerts).values({
        title: 'System Test Alert',
        message: 'This is a test of the emergency alert system. This is only a test.',
        severity: 'medium',
        createdBy: admin.id,
        channels: ['email'],
        status: 'sent',
        sentAt: new Date(),
        targeting: { roles: ['subscriber', 'operator', 'admin'], specific: [] }
      }).returning();
      
      console.log('Sample alert created with ID:', alert.id);
      
      // Create sample incident
      const [incident] = await db.insert(schema.incidents).values({
        title: 'System Test Incident',
        description: 'This is a test incident for the emergency alert system.',
        severity: 'medium',
        reportedBy: operator.id,
        status: 'active',
        relatedAlertId: alert.id,
        responses: [
          {
            action: 'Initial assessment',
            userId: operator.id,
            timestamp: new Date(),
            notes: 'Initial assessment of the test incident.'
          }
        ],
        statusHistory: [
          {
            status: 'reported',
            timestamp: new Date(Date.now() - 3600000),
            userId: operator.id
          },
          {
            status: 'active',
            timestamp: new Date(),
            userId: admin.id,
            notes: 'Moving to active status for testing.'
          }
        ]
      }).returning();
      
      console.log('Sample incident created with ID:', incident.id);
      
      // Create sample acknowledgments
      await db.insert(schema.alertAcknowledgments).values({
        alertId: alert.id,
        userId: user.id,
        notes: 'Acknowledged test alert'
      });
      
      await db.insert(schema.alertAcknowledgments).values({
        alertId: alert.id,
        userId: operator.id,
        notes: 'Test alert received and acknowledged'
      });
      
      console.log('Sample acknowledgments created');
    } else {
      console.log('Database already initialized with admin user');
    }
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error during database initialization:', error);
  } finally {
    process.exit(0);
  }
}

// Run the initialization
initializeDatabase();