import api from './api';
import type { 
  PlotProductionSnapshot, 
  SnapshotCreate,
  AnalyticsFilters,
  FarmSummary 
} from '@/types/analytics';

export interface ProductionForecast {
  total_estimated_kg: number;
  total_estimated_tons: number;
  harvest_start: string | null;
  harvest_end: string | null;
  plots_ready: number;
  plots_in_progress: number;
}

export interface HistoricalDataPoint {
  date: string;
  value: number;
}

export interface HistoricalData {
  metric: string;
  period: string;
  data: HistoricalDataPoint[];
}

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
    const response = await api.get<PlotProductionSnapshot[]>(`/analytics/plots/${plotId}/snapshots`);
    return response.data;
  },

  /**
   * Get latest snapshot for each plot in a farm
   */
  async getLatestSnapshots(farmId?: string): Promise<PlotProductionSnapshot[]> {
    const response = await api.get<PlotProductionSnapshot[]>('/analytics/latest', {
      params: farmId ? { farm_id: farmId } : undefined,
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
  async getProductionForecast(farmId: string): Promise<ProductionForecast> {
    const response = await api.get<ProductionForecast>(`/analytics/farm/${farmId}/forecast`);
    return response.data;
  },

  /**
   * Get historical data for charts
   */
  async getHistoricalData(
    farmId: string,
    metric: 'health_score' | 'yield' | 'moisture' | 'temperature',
    period: '7d' | '30d' | '90d' | '1y'
  ): Promise<HistoricalDataPoint[]> {
    const response = await api.get<HistoricalData>(`/analytics/farm/${farmId}/history`, {
      params: { metric, period },
    });
    return response.data.data;
  },

  /**
   * Get production analytics overview
   */
  async getProductionAnalytics(farmId?: string): Promise<{
    total_plots: number;
    plots_with_data: number;
    total_fruits: number;
    estimated_yield_kg: number;
    estimated_yield_tons: number;
    status_summary: Record<string, number>;
    snapshots: Array<{
      plot_id: string;
      plot_name: string;
      plot_code: string | null;
      snapshot: {
        id: string;
        status: string;
        health_score: number | null;
        production_stage: string | null;
        total_fruits: number | null;
        estimated_yield_kg: number;
        days_to_harvest: number | null;
        risk_level: string | null;
      };
    }>;
  }> {
    const response = await api.get('/analytics/production', {
      params: farmId ? { farm_id: farmId } : undefined,
    });
    return response.data;
  },
};

export default analyticsService;
