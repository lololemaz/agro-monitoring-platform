import api from './api';
import type { Sensor, SensorType } from '@/types/sensor';

export interface SensorFilters {
  farm_id?: string;
  plot_id?: string;
  sensor_type_id?: string;
  is_online?: boolean;
}

export interface SensorCreate {
  farm_id?: string;
  plot_id?: string;
  sensor_type_id: string;
  name: string;
  serial_number?: string;
  mac_address?: string;
  location?: {
    lat?: number;
    lng?: number;
    description?: string;
  };
  installation_date?: string;
  firmware_version?: string;
  configuration?: Record<string, unknown>;
}

export interface SensorUpdate {
  farm_id?: string;
  plot_id?: string;
  sensor_type_id?: string;
  name?: string;
  serial_number?: string;
  mac_address?: string;
  location?: {
    lat?: number;
    lng?: number;
    description?: string;
  };
  installation_date?: string;
  firmware_version?: string;
  configuration?: Record<string, unknown>;
  is_active?: boolean;
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

/**
 * Sensors service - CRUD operations for sensors
 */
export const sensorsService = {
  /**
   * Get all sensors, optionally filtered
   */
  async getSensors(filters?: SensorFilters): Promise<Sensor[]> {
    const response = await api.get<Sensor[]>('/sensors/', { params: filters });
    return response.data;
  },

  /**
   * Get sensor by ID
   */
  async getSensor(id: string): Promise<Sensor> {
    const response = await api.get<Sensor>(`/sensors/${id}`);
    return response.data;
  },

  /**
   * Create new sensor
   */
  async createSensor(data: SensorCreate): Promise<Sensor> {
    const response = await api.post<Sensor>('/sensors/', data);
    return response.data;
  },

  /**
   * Update sensor
   */
  async updateSensor(id: string, data: SensorUpdate): Promise<Sensor> {
    const response = await api.put<Sensor>(`/sensors/${id}`, data);
    return response.data;
  },

  /**
   * Delete sensor (soft delete)
   */
  async deleteSensor(id: string): Promise<void> {
    await api.delete(`/sensors/${id}`);
  },

  /**
   * Get sensors with health issues (offline, low battery, weak signal)
   */
  async getSensorHealthIssues(farmId?: string): Promise<SensorHealthIssue[]> {
    const response = await api.get<SensorHealthIssue[]>('/sensors/health-issues', {
      params: { farm_id: farmId },
    });
    return response.data;
  },

  /**
   * Get available sensor types
   */
  async getSensorTypes(): Promise<SensorType[]> {
    // This might be from admin endpoint or a public one
    const response = await api.get<SensorType[]>('/sensor-types/');
    return response.data;
  },
};

export default sensorsService;
