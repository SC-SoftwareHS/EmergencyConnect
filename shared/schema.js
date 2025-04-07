/**
 * Database schema for the Emergency Alert System using Drizzle ORM
 */
const { pgTable, serial, text, timestamp, boolean, integer, jsonb, varchar } = require('drizzle-orm/pg-core');
const { relations } = require('drizzle-orm');

// Define tables first
// Users table
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull().default('subscriber'),
  channels: jsonb('channels').notNull().default({ email: true, sms: false, push: false }),
  phoneNumber: text('phone_number'),
  pushToken: text('push_token'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Alerts table
const alerts = pgTable('alerts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  severity: text('severity').notNull().default('medium'),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  channels: jsonb('channels').notNull().default(['email']),
  status: text('status').notNull().default('draft'),
  sentAt: timestamp('sent_at'),
  targeting: jsonb('targeting').notNull().default({ roles: [], specific: [] }),
  attachments: jsonb('attachments').notNull().default([]),
  deliveryStats: jsonb('delivery_stats').notNull().default({ total: 0, sent: 0, failed: 0, pending: 0 })
});

// Alert Acknowledgments table (for two-way acknowledgments)
const alertAcknowledgments = pgTable('alert_acknowledgments', {
  id: serial('id').primaryKey(),
  alertId: integer('alert_id').notNull().references(() => alerts.id),
  userId: integer('user_id').notNull().references(() => users.id),
  acknowledgedAt: timestamp('acknowledged_at').defaultNow().notNull(),
  notes: text('notes')
});

// Subscriptions table
const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  categories: jsonb('categories').notNull().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  active: boolean('active').notNull().default(true)
});

// Notification Templates table
const notificationTemplates = pgTable('notification_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // 'alert', 'incident', etc.
  category: varchar('category', { length: 50 }).notNull(), // 'emergency', 'weather', 'security', etc.
  title: text('title').notNull(),
  content: text('content').notNull(),
  variables: jsonb('variables').notNull().default([]), // ['location', 'severity', 'time', etc.]
  translations: jsonb('translations').notNull().default({}), // { 'es': { title: '...', content: '...' } }
  channels: jsonb('channels').notNull().default(['email']), // ['email', 'sms', 'push']
  severity: varchar('severity', { length: 20 }).notNull().default('medium'),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isActive: boolean('is_active').notNull().default(true)
});

// Incidents table
const incidents = pgTable('incidents', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  location: text('location'),
  severity: text('severity').notNull().default('medium'),
  reportedBy: integer('reported_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  status: text('status').notNull().default('reported'),
  attachments: jsonb('attachments').notNull().default([]),
  relatedAlertId: integer('related_alert_id').references(() => alerts.id),
  responses: jsonb('responses').notNull().default([]),
  statusHistory: jsonb('status_history').notNull().default([])
});

// Now define relations after all tables are defined
// User-to-other-tables relations
const usersRelations = relations(users, ({ many }) => ({
  alerts: many(alerts, { relationName: 'user_alerts' }),
  subscriptions: many(subscriptions),
  incidents: many(incidents),
  templates: many(notificationTemplates, { relationName: 'user_templates' })
}));

// Alert-to-other-tables relations
const alertsRelations = relations(alerts, ({ one, many }) => ({
  creator: one(users, {
    fields: [alerts.createdBy],
    references: [users.id],
    relationName: 'user_alerts'
  }),
  acknowledgments: many(alertAcknowledgments),
  relatedIncidents: many(incidents)
}));

// AlertAcknowledgment-to-other-tables relations
const alertAcknowledgmentsRelations = relations(alertAcknowledgments, ({ one }) => ({
  alert: one(alerts, {
    fields: [alertAcknowledgments.alertId],
    references: [alerts.id]
  }),
  user: one(users, {
    fields: [alertAcknowledgments.userId],
    references: [users.id]
  })
}));

// Subscription-to-other-tables relations
const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id]
  })
}));

// Incident-to-other-tables relations
const incidentsRelations = relations(incidents, ({ one }) => ({
  reporter: one(users, {
    fields: [incidents.reportedBy],
    references: [users.id]
  }),
  relatedAlert: one(alerts, {
    fields: [incidents.relatedAlertId],
    references: [alerts.id]
  })
}));

// NotificationTemplate-to-other-tables relations
const notificationTemplatesRelations = relations(notificationTemplates, ({ one }) => ({
  creator: one(users, {
    fields: [notificationTemplates.createdBy],
    references: [users.id],
    relationName: 'user_templates'
  })
}));

module.exports = {
  users,
  alerts,
  alertAcknowledgments,
  subscriptions,
  incidents,
  notificationTemplates,
  // Export relations for use in queries
  usersRelations,
  alertsRelations,
  alertAcknowledgmentsRelations,
  subscriptionsRelations,
  incidentsRelations,
  notificationTemplatesRelations
};