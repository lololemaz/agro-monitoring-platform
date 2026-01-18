/**
 * Farm types based on backend schema
 */

export interface Farm {
  id: string;
  organization_id: string;
  name: string;
  code: string | null;
  total_area: number | null;
  address: string | null;
  coordinates: {
    lat: number;
    lng: number;
  } | null;
  timezone: string;
  settings: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface FarmCreate {
  name: string;
  code?: string;
  total_area?: number;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  timezone?: string;
  settings?: Record<string, unknown>;
  organization_id?: string;
}

export interface FarmUpdate {
  name?: string;
  code?: string;
  total_area?: number;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  timezone?: string;
  settings?: Record<string, unknown>;
  is_active?: boolean;
}

export interface FarmWithStats extends Farm {
  plots_count?: number;
  sensors_count?: number;
  active_alerts_count?: number;
  health_score?: number;
}
