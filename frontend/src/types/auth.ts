/**
 * Authentication and User types based on backend schema
 */

export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  organization_id: string | null;
  is_active: boolean;
  is_email_verified: boolean;
  is_superuser: boolean;
  is_org_owner: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  roles?: Role[];
  role_names?: string[];
}

export interface UserCreate {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role_id?: string;
}

export interface UserUpdate {
  first_name?: string;
  last_name?: string;
  phone?: string;
  is_active?: boolean;
  role_id?: string;
}

export interface UserResetPassword {
  new_password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSuperuser: boolean;
}

export interface Role {
  id: string;
  organization_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  is_system_role: boolean;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export type UserRoleSlug = 'owner' | 'executive' | 'agronomist' | 'operator' | 'viewer';

export const USER_ROLE_LABELS: Record<UserRoleSlug, string> = {
  owner: 'Proprietário',
  executive: 'Executivo',
  agronomist: 'Agrônomo',
  operator: 'Operador',
  viewer: 'Visualizador',
};
