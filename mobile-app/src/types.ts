// Navigation types
export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  AlertDetail: { alertId: string };
};

// User types
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
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

// Alert types
export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  createdAt: string;
  status: 'pending' | 'active' | 'resolved' | 'cancelled';
  createdBy: {
    id: number;
    username: string;
  };
  channels: string[];
  acknowledged?: boolean;
  acknowledgedAt?: string;
}

export interface AlertsState {
  alerts: Alert[];
  isLoading: boolean;
  error: string | null;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}