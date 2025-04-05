/**
 * Database initialization script for the Emergency Alert System
 * This script seeds the database with initial data for users, alerts, and incidents
 */
require('dotenv').config();
const { db } = require('../db');
const schema = require('../shared/schema');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  try {
    console.log('Starting database seeding process...');

    // Hash passwords for users
    const adminPassword = await bcrypt.hash('admin123', 10);
    const operatorPassword = await bcrypt.hash('operator123', 10);
    const subscriberPassword = await bcrypt.hash('subscriber123', 10);

    // First check if we already have users
    const existingUsers = await db.select().from(schema.users);

    if (existingUsers.length > 0) {
      console.log(`Database already has ${existingUsers.length} users. Skipping user creation.`);
    } else {
      // Create users
      const [adminUser] = await db.insert(schema.users).values({
        username: 'admin',
        email: 'admin@example.com',
        password: adminPassword,
        role: 'admin',
        channels: { email: true, sms: true, push: false },
        phoneNumber: '+11234567890'
      }).returning();

      const [operatorUser] = await db.insert(schema.users).values({
        username: 'operator',
        email: 'operator@example.com',
        password: operatorPassword,
        role: 'operator',
        channels: { email: true, sms: false, push: false }
      }).returning();

      const [subscriberUser] = await db.insert(schema.users).values({
        username: 'subscriber',
        email: 'subscriber@example.com',
        password: subscriberPassword,
        role: 'subscriber',
        channels: { email: true, sms: false, push: false }
      }).returning();

      console.log('Created users:');
      console.log(`- Admin: ${adminUser.username} (ID: ${adminUser.id})`);
      console.log(`- Operator: ${operatorUser.username} (ID: ${operatorUser.id})`);
      console.log(`- Subscriber: ${subscriberUser.username} (ID: ${subscriberUser.id})`);

      // Create subscriptions for users
      await db.insert(schema.subscriptions).values({
        userId: adminUser.id,
        categories: ['emergency', 'weather', 'security'],
        active: true
      });

      await db.insert(schema.subscriptions).values({
        userId: operatorUser.id,
        categories: ['emergency', 'weather'],
        active: true
      });

      await db.insert(schema.subscriptions).values({
        userId: subscriberUser.id,
        categories: ['emergency'],
        active: true
      });

      console.log('Created subscriptions for all users');

      // Create sample incidents
      const [incident1] = await db.insert(schema.incidents).values({
        title: 'Building Fire',
        description: 'A fire has been reported in the east wing of Building A.',
        location: 'Building A, East Wing',
        severity: 'high',
        reportedBy: adminUser.id,
        status: 'active',
        statusHistory: [
          {
            status: 'reported',
            updatedBy: adminUser.id,
            updatedAt: new Date(Date.now() - 3600000), // 1 hour ago
            notes: 'Initial report'
          },
          {
            status: 'active',
            updatedBy: adminUser.id,
            updatedAt: new Date(),
            notes: 'Fire department responding'
          }
        ],
        responses: [
          {
            action: 'Fire department notified',
            respondedBy: adminUser.id,
            respondedAt: new Date(Date.now() - 3000000), // 50 minutes ago
            notes: 'Called fire department'
          },
          {
            action: 'Building evacuation initiated',
            respondedBy: operatorUser.id,
            respondedAt: new Date(Date.now() - 2700000), // 45 minutes ago
            notes: 'Activated evacuation alarm'
          }
        ]
      }).returning();

      const [incident2] = await db.insert(schema.incidents).values({
        title: 'Power Outage',
        description: 'Power outage affecting the main campus buildings.',
        location: 'Main Campus',
        severity: 'medium',
        reportedBy: operatorUser.id,
        status: 'resolved',
        statusHistory: [
          {
            status: 'reported',
            updatedBy: operatorUser.id,
            updatedAt: new Date(Date.now() - 86400000), // 1 day ago
            notes: 'Initial report'
          },
          {
            status: 'active',
            updatedBy: operatorUser.id,
            updatedAt: new Date(Date.now() - 82800000), // 23 hours ago
            notes: 'Maintenance team dispatched'
          },
          {
            status: 'resolved',
            updatedBy: adminUser.id,
            updatedAt: new Date(Date.now() - 79200000), // 22 hours ago
            notes: 'Power restored'
          }
        ]
      }).returning();

      console.log('Created sample incidents:');
      console.log(`- Incident 1: ${incident1.title} (ID: ${incident1.id})`);
      console.log(`- Incident 2: ${incident2.title} (ID: ${incident2.id})`);

      // Create sample alerts
      const [alert1] = await db.insert(schema.alerts).values({
        title: 'Emergency Evacuation',
        message: 'Please evacuate Building A immediately due to fire. Proceed to the nearest exit and gather at the designated assembly point.',
        severity: 'high',
        createdBy: adminUser.id,
        status: 'sent',
        sentAt: new Date(Date.now() - 2700000), // 45 minutes ago
        channels: ['email', 'sms'],
        targeting: {
          roles: ['admin', 'operator', 'subscriber'],
          specific: []
        },
        deliveryStats: {
          total: 3,
          sent: 3,
          failed: 0,
          pending: 0
        },
        relatedIncidentId: incident1.id
      }).returning();

      const [alert2] = await db.insert(schema.alerts).values({
        title: 'Power Outage Notice',
        message: 'The power outage on the main campus has been resolved. All systems should now be back to normal operation.',
        severity: 'medium',
        createdBy: adminUser.id,
        status: 'sent',
        sentAt: new Date(Date.now() - 79200000), // 22 hours ago
        channels: ['email'],
        targeting: {
          roles: ['admin', 'operator', 'subscriber'],
          specific: []
        },
        deliveryStats: {
          total: 3,
          sent: 3,
          failed: 0,
          pending: 0
        },
        relatedIncidentId: incident2.id
      }).returning();

      console.log('Created sample alerts:');
      console.log(`- Alert 1: ${alert1.title} (ID: ${alert1.id})`);
      console.log(`- Alert 2: ${alert2.title} (ID: ${alert2.id})`);

      // Create sample acknowledgments
      await db.insert(schema.alertAcknowledgments).values({
        alertId: alert1.id,
        userId: adminUser.id,
        acknowledgedAt: new Date(Date.now() - 2600000), // 43 minutes ago
        notes: 'Acknowledged and evacuated'
      });

      await db.insert(schema.alertAcknowledgments).values({
        alertId: alert1.id,
        userId: operatorUser.id,
        acknowledgedAt: new Date(Date.now() - 2580000), // 42 minutes ago
        notes: 'Acknowledged and assisting with evacuation'
      });

      await db.insert(schema.alertAcknowledgments).values({
        alertId: alert2.id,
        userId: adminUser.id,
        acknowledgedAt: new Date(Date.now() - 79100000), // 21 hours 58 minutes ago
        notes: 'Acknowledged'
      });

      await db.insert(schema.alertAcknowledgments).values({
        alertId: alert2.id,
        userId: subscriberUser.id,
        acknowledgedAt: new Date(Date.now() - 79000000), // 21 hours 56 minutes ago
        notes: 'Received, thank you'
      });

      console.log('Created sample acknowledgments for alerts');
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding process finished. Exiting...');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding process failed:', err);
      process.exit(1);
    });
} else {
  // If imported as a module, export the function
  module.exports = { seedDatabase };
}