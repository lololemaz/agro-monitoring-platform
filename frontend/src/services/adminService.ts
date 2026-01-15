import api from './api';
import type { 
  Organization, 
  OrganizationCreate, 
  OrganizationUpdate 
} from '@/types/organization';
import type { 
  SensorType, 
  SensorTypeCreate, 
  SensorTypeUpdate 
} from '@/types/sensor';
import type { User } from '@/types/auth';

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
};

export default adminService;
