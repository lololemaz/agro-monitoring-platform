/**
 * Sensor types based on backend schema
 */

export type SensorCategory = 'soil' | 'weather' | 'camera' | 'irrigation';

export interface SensorType {
  id: string;
  organization_id: string | null;
  name: string;
  slug: string;
  category: SensorCategory;
  description: string | null;
  manufacturer: string | null;
  model: string | null;
  specifications: Record<string, unknown>;
  supported_metrics: string[];
  payload_schema: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SensorTypeCreate {
  name: string;
  slug: string;
  category: SensorCategory;
  description?: string;
  manufacturer?: string;
  model?: string;
  specifications?: Record<string, unknown>;
  supported_metrics?: string[];
  payload_schema?: Record<string, unknown>;
}

export interface SensorTypeUpdate {
  name?: string;
  slug?: string;
  category?: SensorCategory;
  description?: string;
  manufacturer?: string;
  model?: string;
  specifications?: Record<string, unknown>;
  supported_metrics?: string[];
  payload_schema?: Record<string, unknown>;
  is_active?: boolean;
}

export interface Sensor {
  id: string;
  organization_id: string;
  farm_id: string | null;
  plot_id: string | null;
  sensor_type_id: string;
  name: string;
  serial_number: string | null;
  mac_address: string | null;
  api_key: string | null;
  location: {
    lat?: number;
    lng?: number;
    description?: string;
  } | null;
  installation_date: string | null;
  last_signal_at: string | null;
  battery_level: number | null;
  signal_strength: number | null;
  is_online: boolean;
  is_active: boolean;
  firmware_version: string | null;
  configuration: Record<string, unknown>;
  extra_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SensorHealthIssue {
  sensor_id: string;
  sensor_name: string;
  plot_id: string | null;
  plot_name: string | null;
  sensor_type: string;
  last_signal_at: string | null;
  battery_level: number | null;
  signal_strength: number | null;
  is_online: boolean;
  issue: 'offline' | 'low_battery' | 'weak_signal';
}
