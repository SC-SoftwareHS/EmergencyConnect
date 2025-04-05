/**
 * In-memory database for the emergency alert system
 * Provides CRUD operations for users, alerts, subscriptions, and incidents
 */
const User = require('../models/User');
const Alert = require('../models/Alert');
const Subscription = require('../models/Subscription');
const Incident = require('../models/Incident');

// In-memory database
const db = {
  users: [],
  alerts: [],
  subscriptions: [],
  incidents: [],
  idCounters: {
    users: 0,
    alerts: 0,
    subscriptions: 0,
    incidents: 0
  }
};

/**
 * Initialize the database with some sample data
 */
function initializeDatabase() {
  // Create admin user
  const adminUser = new User(
    ++db.idCounters.users,
    'admin',
    'admin@example.com',
    'admin123', // In a real app, this would be hashed
    'admin',
    { email: true, sms: true, push: true },
    '+15551234567'
  );
  
  // Create operator user
  const operatorUser = new User(
    ++db.idCounters.users,
    'operator',
    'operator@example.com',
    'operator123', // In a real app, this would be hashed
    'operator',
    { email: true, sms: true, push: false },
    '+15557654321'
  );
  
  // Create subscriber user
  const subscriberUser = new User(
    ++db.idCounters.users,
    'subscriber',
    'subscriber@example.com',
    'subscriber123', // In a real app, this would be hashed
    'subscriber',
    { email: true, sms: false, push: true },
    null
  );
  
  // Add users to database
  db.users.push(adminUser, operatorUser, subscriberUser);
  
  // Create subscriptions for users
  const adminSubscription = new Subscription(
    ++db.idCounters.subscriptions,
    adminUser.id,
    ['weather', 'security', 'health', 'transportation']
  );
  
  const operatorSubscription = new Subscription(
    ++db.idCounters.subscriptions,
    operatorUser.id,
    ['weather', 'security']
  );
  
  const subscriberSubscription = new Subscription(
    ++db.idCounters.subscriptions,
    subscriberUser.id,
    ['weather', 'health']
  );
  
  // Add subscriptions to database
  db.subscriptions.push(adminSubscription, operatorSubscription, subscriberSubscription);
  
  // Create sample alert
  const sampleAlert = new Alert(
    ++db.idCounters.alerts,
    'Test Emergency Alert',
    'This is a test of the emergency alert system. This is only a test.',
    'medium',
    adminUser.id,
    ['email', 'sms', 'push'],
    { roles: ['admin', 'operator', 'subscriber'], specific: [] }
  );
  
  sampleAlert.updateStatus('sent');
  sampleAlert.updateDeliveryStats({ total: 3, sent: 3, failed: 0, pending: 0 });
  
  // Add alert to database
  db.alerts.push(sampleAlert);
  
  console.log('Database initialized with sample data');
}

/**
 * User-related database operations
 */
const userDB = {
  create: (userData) => {
    const id = ++db.idCounters.users;
    const user = new User(
      id,
      userData.username,
      userData.email,
      userData.password,
      userData.role || 'subscriber',
      userData.channels || { email: true, sms: false, push: false },
      userData.phoneNumber || null
    );
    db.users.push(user);
    return user;
  },
  
  findById: (id) => {
    return db.users.find(user => user.id === id);
  },
  
  findByEmail: (email) => {
    return db.users.find(user => user.email === email);
  },
  
  findByUsername: (username) => {
    return db.users.find(user => user.username === username);
  },
  
  update: (id, updates) => {
    const user = userDB.findById(id);
    if (user) {
      user.update(updates);
      return user;
    }
    return null;
  },
  
  delete: (id) => {
    const index = db.users.findIndex(user => user.id === id);
    if (index !== -1) {
      db.users.splice(index, 1);
      return true;
    }
    return false;
  },
  
  getAll: () => {
    return db.users.map(user => user.getSafeUser());
  },
  
  getAllByRole: (role) => {
    return db.users
      .filter(user => user.role === role)
      .map(user => user.getSafeUser());
  }
};

/**
 * Alert-related database operations
 */
const alertDB = {
  create: (alertData) => {
    const id = ++db.idCounters.alerts;
    const alert = new Alert(
      id,
      alertData.title,
      alertData.message,
      alertData.severity,
      alertData.createdBy,
      alertData.channels || [],
      alertData.targeting || {},
      alertData.attachments || []
    );
    db.alerts.push(alert);
    return alert;
  },
  
  findById: (id) => {
    return db.alerts.find(alert => alert.id === id);
  },
  
  update: (id, updates) => {
    const alert = alertDB.findById(id);
    if (alert) {
      Object.assign(alert, updates);
      alert.updatedAt = new Date();
      return alert;
    }
    return null;
  },
  
  updateStatus: (id, status) => {
    const alert = alertDB.findById(id);
    if (alert) {
      alert.updateStatus(status);
      return alert;
    }
    return null;
  },
  
  delete: (id) => {
    const index = db.alerts.findIndex(alert => alert.id === id);
    if (index !== -1) {
      db.alerts.splice(index, 1);
      return true;
    }
    return false;
  },
  
  getAll: () => {
    return [...db.alerts];
  },
  
  getAllByStatus: (status) => {
    return db.alerts.filter(alert => alert.status === status);
  },
  
  getAllByCreator: (userId) => {
    return db.alerts.filter(alert => alert.createdBy === userId);
  },
  
  getRecentAlerts: (limit = 10) => {
    return [...db.alerts]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }
};

/**
 * Subscription-related database operations
 */
const subscriptionDB = {
  create: (subscriptionData) => {
    const id = ++db.idCounters.subscriptions;
    const subscription = new Subscription(
      id,
      subscriptionData.userId,
      subscriptionData.categories || []
    );
    db.subscriptions.push(subscription);
    return subscription;
  },
  
  findById: (id) => {
    return db.subscriptions.find(subscription => subscription.id === id);
  },
  
  findByUserId: (userId) => {
    return db.subscriptions.find(subscription => subscription.userId === userId);
  },
  
  update: (id, updates) => {
    const subscription = subscriptionDB.findById(id);
    if (subscription) {
      Object.assign(subscription, updates);
      subscription.updatedAt = new Date();
      return subscription;
    }
    return null;
  },
  
  delete: (id) => {
    const index = db.subscriptions.findIndex(subscription => subscription.id === id);
    if (index !== -1) {
      db.subscriptions.splice(index, 1);
      return true;
    }
    return false;
  },
  
  getAll: () => {
    return [...db.subscriptions];
  },
  
  getAllByCategory: (category) => {
    return db.subscriptions.filter(subscription => 
      subscription.active && subscription.categories.includes(category)
    );
  }
};

/**
 * Incident-related database operations
 */
const incidentDB = {
  create: (incidentData) => {
    const id = ++db.idCounters.incidents;
    const incident = new Incident(
      id,
      incidentData.title,
      incidentData.description,
      incidentData.location,
      incidentData.severity,
      incidentData.reportedBy,
      incidentData.attachments || [],
      incidentData.relatedAlertId || null
    );
    db.incidents.push(incident);
    return incident;
  },
  
  findById: (id) => {
    return db.incidents.find(incident => incident.id === id);
  },
  
  update: (id, updates) => {
    const incident = incidentDB.findById(id);
    if (incident) {
      Object.assign(incident, updates);
      incident.updatedAt = new Date();
      return incident;
    }
    return null;
  },
  
  updateStatus: (id, status, userId, notes = '') => {
    const incident = incidentDB.findById(id);
    if (incident) {
      incident.updateStatus(status, userId, notes);
      return incident;
    }
    return null;
  },
  
  addResponse: (id, action, userId, notes = '') => {
    const incident = incidentDB.findById(id);
    if (incident) {
      incident.addResponse(action, userId, notes);
      return incident;
    }
    return null;
  },
  
  delete: (id) => {
    const index = db.incidents.findIndex(incident => incident.id === id);
    if (index !== -1) {
      db.incidents.splice(index, 1);
      return true;
    }
    return false;
  },
  
  getAll: () => {
    return [...db.incidents];
  },
  
  getAllByStatus: (status) => {
    return db.incidents.filter(incident => incident.status === status);
  },
  
  getAllByReporter: (userId) => {
    return db.incidents.filter(incident => incident.reportedBy === userId);
  },
  
  getAllByLocation: (location) => {
    return db.incidents.filter(incident => 
      incident.location && incident.location.toLowerCase().includes(location.toLowerCase())
    );
  },
  
  getRecentIncidents: (limit = 10) => {
    return [...db.incidents]
      .sort((a, b) => b.reportedAt - a.reportedAt)
      .slice(0, limit);
  }
};

module.exports = {
  initializeDatabase,
  userDB,
  alertDB,
  subscriptionDB,
  incidentDB
};
