import api from './api';
import type { 
  Organization, 
  OrganizationCreate, 
  OrganizationUpdate 
} from '@/types/organization';
import type { 
  Sensor,
  SensorType, 
  SensorTypeCreate, 
  SensorTypeUpdate 
} from '@/types/sensor';
import type { User } from '@/types/auth';

export interface AdminSensorCreate {
  farm_id: string;
  plot_id: string;
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

export interface AdminSensorUpdate {
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

/**
 * Admin service - handles superuser operations
 * - Organization management
 * - Sensor type management
 * - Superuser creation
 */
export const adminService = {
  // ==========================================
  // Organizations
  // ==========================================

  /**
   * Get all organizations
   */
  async getOrganizations(): Promise<Organization[]> {
    const response = await api.get<Organization[]>('/admin/organizations');
    return response.data;
  },

  /**
   * Get organization by ID
   */
  async getOrganization(id: string): Promise<Organization> {
    const response = await api.get<Organization>(`/admin/organizations/${id}`);
    return response.data;
  },

  /**
   * Create new organization
   */
  async createOrganization(data: OrganizationCreate): Promise<Organization> {
    const response = await api.post<Organization>('/admin/organizations', data);
    return response.data;
  },

  /**
   * Update organization
   */
  async updateOrganization(id: string, data: OrganizationUpdate): Promise<Organization> {
    const response = await api.patch<Organization>(`/admin/organizations/${id}`, data);
    return response.data;
  },

  /**
   * Delete organization (soft delete)
   */
  async deleteOrganization(id: string): Promise<void> {
    await api.delete(`/admin/organizations/${id}`);
  },

  // ==========================================
  // Sensor Types
  // ==========================================

  /**
   * Get all sensor types
   */
  async getSensorTypes(): Promise<SensorType[]> {
    const response = await api.get<SensorType[]>('/admin/sensor-types');
    return response.data;
  },

  /**
   * Get sensor type by ID
   */
  async getSensorType(id: string): Promise<SensorType> {
    const response = await api.get<SensorType>(`/admin/sensor-types/${id}`);
    return response.data;
  },

  /**
   * Create new sensor type
   */
  async createSensorType(data: SensorTypeCreate): Promise<SensorType> {
    const response = await api.post<SensorType>('/admin/sensor-types', data);
    return response.data;
  },

  /**
   * Update sensor type
   */
  async updateSensorType(id: string, data: SensorTypeUpdate): Promise<SensorType> {
    const response = await api.patch<SensorType>(`/admin/sensor-types/${id}`, data);
    return response.data;
  },

  /**
   * Delete sensor type
   */
  async deleteSensorType(id: string): Promise<void> {
    await api.delete(`/admin/sensor-types/${id}`);
  },

  // ==========================================
  // Sensors (Admin only)
  // ==========================================

  /**
   * Get all sensors for an organization
   */
  async getSensors(organizationId?: string, farmId?: string): Promise<Sensor[]> {
    const response = await api.get<Sensor[]>('/admin/sensors', {
      params: {
        organization_id: organizationId,
        farm_id: farmId,
      },
    });
    return response.data;
  },

  /**
   * Get sensor by ID
   */
  async getSensor(id: string): Promise<Sensor> {
    const response = await api.get<Sensor>(`/admin/sensors/${id}`);
    return response.data;
  },

  /**
   * Create new sensor
   */
  async createSensor(organizationId: string, data: AdminSensorCreate): Promise<Sensor> {
    const response = await api.post<Sensor>('/admin/sensors', data, {
      params: { organization_id: organizationId },
    });
    return response.data;
  },

  /**
   * Update sensor
   */
  async updateSensor(id: string, data: AdminSensorUpdate): Promise<Sensor> {
    const response = await api.patch<Sensor>(`/admin/sensors/${id}`, data);
    return response.data;
  },

  /**
   * Delete sensor (soft delete)
   */
  async deleteSensor(id: string): Promise<void> {
    await api.delete(`/admin/sensors/${id}`);
  },

  // ==========================================
  // Superusers
  // ==========================================

  /**
   * Create new superuser
   */
  async createSuperuser(email: string, password: string): Promise<User> {
    const response = await api.post<User>('/admin/superusers', {
      email,
      password,
    });
    return response.data;
  },

  /**
   * Reset any user's password (superadmin only)
   */
  async resetUserPassword(userId: string, newPassword: string): Promise<void> {
    await api.post(`/admin/users/${userId}/reset-password`, {
      new_password: newPassword,
    });
  },
};

export default adminService;
