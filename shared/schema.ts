/**
 * TypeScript schema definitions for the Emergency Alert System
 * Provides type definitions for the mobile app and server to share
 */

// User type definitions
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'operator' | 'subscriber';
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  phoneNumber?: string;
  pushToken?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InsertUser extends Omit<User, 'id' | 'createdAt' | 'updatedAt'> {
  password: string;
}

// Alert type definitions
export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'cancelled' | 'resolved' | 'expired' | 'draft';
  createdBy: number; // User ID
  createdAt: string;
  updatedAt?: string;
  sentAt?: string;
  channels: string[]; // ["email", "sms", "push"]
  targeting: {
    recipients?: number[]; // User IDs
    roles?: string[]; // Role names
    locations?: string[]; // Location names
    departments?: string[]; // Department names
    all?: boolean; // Send to all users
  };
  acknowledgments?: {
    userId: number;
    timestamp: string;
    notes?: string;
  }[];
  deliveryStats?: {
    total: number;
    sent: number;
    delivered?: number;
    failed: number;
    pending: number;
  };
  attachments?: {
    type: string;
    url: string;
    name: string;
  }[];
}

export interface InsertAlert extends Omit<Alert, 'id' | 'createdAt' | 'updatedAt' | 'acknowledgments'> {}

// Incident type definitions
export interface Incident {
  id: string;
  title: string;
  description: string;
  location: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'reported' | 'investigating' | 'resolved' | 'closed' | 'cancelled';
  reportedBy: number; // User ID
  reportedAt: string; // Same as createdAt
  createdAt: string;
  updatedAt?: string;
  statusUpdates?: {
    status: string;
    userId: number;
    timestamp: string;
    notes: string;
  }[];
  responses?: {
    action: string;
    userId: number;
    timestamp: string;
    notes: string;
  }[];
  relatedAlertId?: string;
  attachments?: {
    type: string;
    url: string;
    name: string;
  }[];
}

export interface InsertIncident extends Omit<Incident, 'id' | 'createdAt' | 'updatedAt' | 'statusUpdates' | 'responses' | 'reportedAt'> {}

// Subscription type definitions
export interface Subscription {
  id: number;
  userId: number;
  categories: string[];
  createdAt: string;
  updatedAt?: string;
  active: boolean;
}

export interface InsertSubscription extends Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'> {}

// Notification preferences
export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  alertSeverityThreshold: 'critical' | 'high' | 'medium' | 'low' | 'all';
}

// Notification Template type definitions
export interface NotificationTemplate {
  id: number;
  name: string;
  description?: string;
  type: 'alert' | 'incident' | 'status' | 'custom';
  category: string; // 'emergency', 'weather', 'security', etc.
  title: string;
  content: string;
  variables: string[]; // ['location', 'severity', 'time', etc.]
  translations: Record<string, { title: string; content: string }>; // { 'es': { title: '...', content: '...' } }
  channels: string[]; // ['email', 'sms', 'push']
  severity: 'critical' | 'high' | 'medium' | 'low';
  createdBy: number; // User ID
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
}

export interface InsertNotificationTemplate extends Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'> {}