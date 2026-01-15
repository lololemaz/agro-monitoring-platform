import api from './api';
import type { Farm, FarmCreate, FarmUpdate, FarmWithStats } from '@/types/farm';
import type { FarmSummary } from '@/types/analytics';

/**
 * Farms service - CRUD operations for farms
 */
export const farmsService = {
  /**
   * Get all farms for the current organization
   */
  async getFarms(): Promise<Farm[]> {
    const response = await api.get<Farm[]>('/farms/');
    return response.data;
  },

  /**
   * Get farm by ID
   */
  async getFarm(id: string): Promise<Farm> {
    const response = await api.get<Farm>(`/farms/${id}`);
    return response.data;
  },

  /**
   * Get farm with stats (plots count, alerts, etc.)
   */
  async getFarmWithStats(id: string): Promise<FarmWithStats> {
    const response = await api.get<FarmWithStats>(`/farms/${id}`, {
      params: { include_stats: true },
    });
    return response.data;
  },

  /**
   * Get farm summary statistics
   */
  async getFarmSummary(farmId: string): Promise<FarmSummary> {
    const response = await api.get<FarmSummary>(`/farms/${farmId}/summary`);
    return response.data;
  },

  /**
   * Create new farm
   */
  async createFarm(data: FarmCreate): Promise<Farm> {
    const response = await api.post<Farm>('/farms/', data);
    return response.data;
  },

  /**
   * Update farm
   */
  async updateFarm(id: string, data: FarmUpdate): Promise<Farm> {
    const response = await api.put<Farm>(`/farms/${id}`, data);
    return response.data;
  },

  /**
   * Delete farm (soft delete)
   */
  async deleteFarm(id: string): Promise<void> {
    await api.delete(`/farms/${id}`);
  },
};

export default farmsService;
