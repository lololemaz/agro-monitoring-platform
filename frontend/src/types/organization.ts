/**
 * Organization types based on backend schema
 */

export interface Organization {
  id: string;
  name: string;
  company_name: string | null;
  document: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  settings: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  owner_id: string | null;
  owner_email: string | null;
  owner_first_name: string | null;
  owner_last_name: string | null;
}

export interface OrganizationCreate {
  name: string;
  company_name?: string;
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo_url?: string;
  settings?: Record<string, unknown>;
  // Owner fields (required for creation)
  owner_email: string;
  owner_password: string;
  owner_first_name?: string;
  owner_last_name?: string;
}

export interface OrganizationUpdate {
  name?: string;
  company_name?: string;
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo_url?: string;
  settings?: Record<string, unknown>;
  is_active?: boolean;
  // Owner fields (for updating owner data)
  owner_first_name?: string;
  owner_last_name?: string;
  owner_password?: string; // Only if resetting password
}
