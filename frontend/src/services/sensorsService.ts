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
  dev_eui?: string;
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
  dev_eui?: string;
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

export interface SensorHeatmapData {
  sensor_id: string;
  sensor_name: string;
  plot_id: string | null;
  plot_name: string | null;
  location: {
    lat?: number;
    lng?: number;
    description?: string;
    x?: number;
    y?: number;
  } | null;
  is_online: boolean;
  last_signal_at: string | null;
  metrics: {
    soilMoisture?: number;
    temperature?: number;
    electricalConductivity?: number;
    ph?: number;
    nitrogen?: number;
    potassium?: number;
    phosphorus?: number;
    chlorophyllIndex?: number;
    mangoCount?: number;
    limeApplication?: number;
  };
  is_critical: boolean;
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
    const response = await api.get<SensorType[]>('/sensors/types');
    return response.data;
  },

  /**
   * Get heatmap data for sensors with latest readings
   */
  async getHeatmapData(farmId?: string): Promise<SensorHeatmapData[]> {
    const response = await api.get<SensorHeatmapData[]>('/sensors/heatmap-data', {
      params: { farm_id: farmId },
    });
    return response.data;
  },
};

export default sensorsService;
