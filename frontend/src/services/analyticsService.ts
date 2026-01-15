import api from './api';
import type { 
  PlotProductionSnapshot, 
  SnapshotCreate,
  AnalyticsFilters,
  FarmSummary 
} from '@/types/analytics';

/**
 * Analytics service - production snapshots and farm statistics
 */
export const analyticsService = {
  /**
   * Get production snapshots, optionally filtered
   */
  async getSnapshots(filters?: AnalyticsFilters): Promise<PlotProductionSnapshot[]> {
    const response = await api.get<PlotProductionSnapshot[]>('/analytics/', { 
      params: filters,
    });
    return response.data;
  },

  /**
   * Get snapshots for a specific farm
   */
  async getFarmSnapshots(farmId: string): Promise<PlotProductionSnapshot[]> {
    return this.getSnapshots({ farm_id: farmId });
  },

  /**
   * Get snapshots for a specific plot
   */
  async getPlotSnapshots(plotId: string): Promise<PlotProductionSnapshot[]> {
    return this.getSnapshots({ plot_id: plotId });
  },

  /**
   * Get latest snapshot for each plot in a farm
   */
  async getLatestSnapshots(farmId: string): Promise<PlotProductionSnapshot[]> {
    const response = await api.get<PlotProductionSnapshot[]>('/analytics/latest', {
      params: { farm_id: farmId },
    });
    return response.data;
  },

  /**
   * Get snapshot by ID
   */
  async getSnapshot(id: string): Promise<PlotProductionSnapshot> {
    const response = await api.get<PlotProductionSnapshot>(`/analytics/${id}`);
    return response.data;
  },

  /**
   * Create new snapshot
   */
  async createSnapshot(data: SnapshotCreate): Promise<PlotProductionSnapshot> {
    const response = await api.post<PlotProductionSnapshot>('/analytics/', data);
    return response.data;
  },

  // ==========================================
  // Farm Summary & Statistics
  // ==========================================

  /**
   * Get farm summary statistics
   */
  async getFarmSummary(farmId: string): Promise<FarmSummary> {
    const response = await api.get<FarmSummary>(`/analytics/farm/${farmId}/summary`);
    return response.data;
  },

  /**
   * Get production forecast for farm
   */
  async getProductionForecast(farmId: string): Promise<{
    total_estimated_kg: number;
    total_estimated_tons: number;
    harvest_start: string | null;
    harvest_end: string | null;
    plots_ready: number;
    plots_in_progress: number;
  }> {
    const response = await api.get(`/analytics/farm/${farmId}/forecast`);
    return response.data;
  },

  /**
   * Get historical data for charts
   */
  async getHistoricalData(
    farmId: string,
    metric: 'health_score' | 'yield' | 'moisture' | 'temperature',
    period: '7d' | '30d' | '90d' | '1y'
  ): Promise<Array<{ date: string; value: number }>> {
    const response = await api.get(`/analytics/farm/${farmId}/history`, {
      params: { metric, period },
    });
    return response.data;
  },
};

export default analyticsService;
