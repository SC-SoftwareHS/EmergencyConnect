/**
 * Type definitions for the Emergency Connect mobile app
 */

// API Response type
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Authentication types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: "admin" | "operator" | "subscriber";
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

// Alert related types
export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "active" | "cancelled" | "resolved" | "expired";
  createdBy: number; // User ID
  createdAt: string;
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
  }[];
  deliveryStats?: {
    sent: number;
    delivered: number;
    failed: number;
  };
  attachments?: {
    type: string;
    url: string;
    name: string;
  }[];
}

// Incident related types
export interface Incident {
  id: string;
  title: string;
  description: string;
  location: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "reported" | "investigating" | "resolved" | "closed" | "cancelled";
  reportedBy: number; // User ID
  reportedAt: string;
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

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  SimplifiedLogin: undefined;
  Dashboard: undefined;
  Alerts: undefined;
  AlertDetail: { alertId: string };
  Incidents: undefined;
  IncidentDetail: { incidentId: string };
  IncidentReport: undefined;
  Profile: undefined;
  Settings: undefined;
};

// Settings and preferences
export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  alertSeverityThreshold: "critical" | "high" | "medium" | "low" | "all";
}