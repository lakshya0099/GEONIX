// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'superadmin' | 'orgadmin' | 'employee';
  organization: string;
  is_active: boolean;
  date_joined: string;
}

export interface AuthState {
  user: User | null;
  tokens: {
    access: string;
    refresh: string;
  } | null;
  isLoading: boolean;
  error: string | null;
}

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: ('superadmin' | 'orgadmin' | 'employee')[];
}

export interface RegisterCredentials {
  admin_name: string;
  admin_email: string;
  organization_name: string;
  subdomain: string;
  password: string;
  confirm_password: string;
}
 
export interface RegisterResponse {
  message: string; // "Organization created successfully"
}
 