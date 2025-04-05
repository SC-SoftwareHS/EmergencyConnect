/**
 * Database service for the emergency alert system
 * Provides functions to interact with the PostgreSQL database using Drizzle ORM
 */
const { db } = require('../db');
const schema = require('../shared/schema');
const { eq, or, and, desc, asc, sql } = require('drizzle-orm');
const bcrypt = require('bcryptjs');

/**
 * User-related database operations
 */
const userDB = {
  create: async (userData) => {
    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const [user] = await db.insert(schema.users)
      .values({
        ...userData,
        password: hashedPassword
      })
      .returning();
    
    return user;
  },
  
  findById: async (id) => {
    const [user] = await db.select()
      .from(schema.users)
      .where(eq(schema.users.id, id));
    
    return user || null;
  },
  
  findByEmail: async (email) => {
    const [user] = await db.select()
      .from(schema.users)
      .where(eq(schema.users.email, email));
    
    return user || null;
  },
  
  findByUsername: async (username) => {
    const [user] = await db.select()
      .from(schema.users)
      .where(eq(schema.users.username, username));
    
    return user || null;
  },
  
  update: async (id, updates) => {
    // If password is being updated, hash it
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    
    const [updatedUser] = await db.update(schema.users)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(schema.users.id, id))
      .returning();
    
    return updatedUser || null;
  },
  
  delete: async (id) => {
    const result = await db.delete(schema.users)
      .where(eq(schema.users.id, id));
    
    return result.count > 0;
  },
  
  getAll: async () => {
    const users = await db.select()
      .from(schema.users)
      .orderBy(asc(schema.users.id));
    
    return users;
  },
  
  getAllByRole: async (role) => {
    const users = await db.select()
      .from(schema.users)
      .where(eq(schema.users.role, role))
      .orderBy(asc(schema.users.id));
    
    return users;
  },
  
  validatePassword: async (user, password) => {
    return await bcrypt.compare(password, user.password);
  }
};

/**
 * Alert-related database operations
 */
const alertDB = {
  create: async (alertData) => {
    const [alert] = await db.insert(schema.alerts)
      .values(alertData)
      .returning();
    
    return alert;
  },
  
  findById: async (id) => {
    const [alert] = await db.select()
      .from(schema.alerts)
      .where(eq(schema.alerts.id, id));
    
    return alert || null;
  },
  
  update: async (id, updates) => {
    const [updatedAlert] = await db.update(schema.alerts)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(schema.alerts.id, id))
      .returning();
    
    return updatedAlert || null;
  },
  
  delete: async (id) => {
    // First delete all acknowledgments
    await db.delete(schema.alertAcknowledgments)
      .where(eq(schema.alertAcknowledgments.alertId, id));
    
    // Then delete the alert
    const result = await db.delete(schema.alerts)
      .where(eq(schema.alerts.id, id));
    
    return result.count > 0;
  },
  
  getAll: async () => {
    const alerts = await db.select()
      .from(schema.alerts)
      .orderBy(desc(schema.alerts.createdAt));
    
    return alerts;
  },
  
  getAllByUser: async (userId) => {
    const alerts = await db.select()
      .from(schema.alerts)
      .where(eq(schema.alerts.createdBy, userId))
      .orderBy(desc(schema.alerts.createdAt));
    
    return alerts;
  },
  
  getAllByStatus: async (status) => {
    const alerts = await db.select()
      .from(schema.alerts)
      .where(eq(schema.alerts.status, status))
      .orderBy(desc(schema.alerts.createdAt));
    
    return alerts;
  },
  
  addAcknowledgment: async (alertId, userId, notes = '') => {
    try {
      const [ack] = await db.insert(schema.alertAcknowledgments)
        .values({
          alertId,
          userId,
          acknowledgedAt: new Date(),
          notes
        })
        .returning();
      
      return ack;
    } catch (error) {
      // Handle unique constraint violation
      if (error.code === '23505') { // PostgreSQL unique violation code
        return null;
      }
      throw error;
    }
  },
  
  getAcknowledgments: async (alertId) => {
    const acknowledgments = await db.select({
      id: schema.alertAcknowledgments.id,
      alertId: schema.alertAcknowledgments.alertId,
      userId: schema.alertAcknowledgments.userId,
      acknowledgedAt: schema.alertAcknowledgments.acknowledgedAt,
      notes: schema.alertAcknowledgments.notes,
      username: schema.users.username,
      email: schema.users.email
    })
    .from(schema.alertAcknowledgments)
    .innerJoin(
      schema.users,
      eq(schema.alertAcknowledgments.userId, schema.users.id)
    )
    .where(eq(schema.alertAcknowledgments.alertId, alertId))
    .orderBy(asc(schema.alertAcknowledgments.acknowledgedAt));
    
    return acknowledgments;
  },
  
  hasUserAcknowledged: async (alertId, userId) => {
    const [acknowledgment] = await db.select()
      .from(schema.alertAcknowledgments)
      .where(
        and(
          eq(schema.alertAcknowledgments.alertId, alertId),
          eq(schema.alertAcknowledgments.userId, userId)
        )
      );
    
    return !!acknowledgment;
  },
  
  getAcknowledgmentStats: async (alertId) => {
    const [result] = await db
      .select({
        total: sql`COUNT(*)`.mapWith(Number)
      })
      .from(schema.alertAcknowledgments)
      .where(eq(schema.alertAcknowledgments.alertId, alertId));
    
    return {
      total: result.total || 0
    };
  }
};

/**
 * Subscription-related database operations
 */
const subscriptionDB = {
  create: async (subscriptionData) => {
    const [subscription] = await db.insert(schema.subscriptions)
      .values(subscriptionData)
      .returning();
    
    return subscription;
  },
  
  findById: async (id) => {
    const [subscription] = await db.select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.id, id));
    
    return subscription || null;
  },
  
  findByUserId: async (userId) => {
    const [subscription] = await db.select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.userId, userId));
    
    return subscription || null;
  },
  
  update: async (id, updates) => {
    const [updatedSubscription] = await db.update(schema.subscriptions)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(schema.subscriptions.id, id))
      .returning();
    
    return updatedSubscription || null;
  },
  
  delete: async (id) => {
    const result = await db.delete(schema.subscriptions)
      .where(eq(schema.subscriptions.id, id));
    
    return result.count > 0;
  },
  
  getAll: async () => {
    const subscriptions = await db.select()
      .from(schema.subscriptions)
      .orderBy(asc(schema.subscriptions.id));
    
    return subscriptions;
  },
  
  getAllByCategory: async (category) => {
    // This is more complex since categories are stored in a JSON array
    // We need to use a SQL fragment for this
    const subscriptions = await db.select()
      .from(schema.subscriptions)
      .where(
        sql`${schema.subscriptions.active} = true AND ${category} = ANY(${schema.subscriptions.categories})`
      );
    
    return subscriptions;
  }
};

/**
 * Incident-related database operations
 */
const incidentDB = {
  create: async (incidentData) => {
    const [incident] = await db.insert(schema.incidents)
      .values(incidentData)
      .returning();
    
    return incident;
  },
  
  findById: async (id) => {
    const [incident] = await db.select()
      .from(schema.incidents)
      .where(eq(schema.incidents.id, id));
    
    return incident || null;
  },
  
  update: async (id, updates) => {
    const [updatedIncident] = await db.update(schema.incidents)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(schema.incidents.id, id))
      .returning();
    
    return updatedIncident || null;
  },
  
  updateStatus: async (id, status, userId, notes = '') => {
    // First get the current incident
    const incident = await incidentDB.findById(id);
    
    if (!incident) {
      return null;
    }
    
    // Create a status update entry
    const statusUpdate = {
      status,
      updatedBy: userId,
      updatedAt: new Date(),
      notes
    };
    
    // Get the current status history or initialize an empty array
    const statusHistory = incident.statusHistory || [];
    
    // Update the incident
    const [updatedIncident] = await db.update(schema.incidents)
      .set({
        status,
        updatedAt: new Date(),
        statusHistory: [...statusHistory, statusUpdate]
      })
      .where(eq(schema.incidents.id, id))
      .returning();
    
    return updatedIncident || null;
  },
  
  addResponse: async (id, action, userId, notes = '') => {
    // First get the current incident
    const incident = await incidentDB.findById(id);
    
    if (!incident) {
      return null;
    }
    
    // Create a response entry
    const responseEntry = {
      action,
      respondedBy: userId,
      respondedAt: new Date(),
      notes
    };
    
    // Get the current responses or initialize an empty array
    const responses = incident.responses || [];
    
    // Update the incident
    const [updatedIncident] = await db.update(schema.incidents)
      .set({
        updatedAt: new Date(),
        responses: [...responses, responseEntry]
      })
      .where(eq(schema.incidents.id, id))
      .returning();
    
    return updatedIncident || null;
  },
  
  delete: async (id) => {
    const result = await db.delete(schema.incidents)
      .where(eq(schema.incidents.id, id));
    
    return result.count > 0;
  },
  
  getAll: async () => {
    const incidents = await db.select()
      .from(schema.incidents)
      .orderBy(desc(schema.incidents.createdAt));
    
    return incidents;
  },
  
  getAllByStatus: async (status) => {
    const incidents = await db.select()
      .from(schema.incidents)
      .where(eq(schema.incidents.status, status))
      .orderBy(desc(schema.incidents.createdAt));
    
    return incidents;
  },
  
  getAllByReporter: async (userId) => {
    const incidents = await db.select()
      .from(schema.incidents)
      .where(eq(schema.incidents.reportedBy, userId))
      .orderBy(desc(schema.incidents.createdAt));
    
    return incidents;
  }
};

module.exports = {
  userDB,
  alertDB,
  subscriptionDB,
  incidentDB
};