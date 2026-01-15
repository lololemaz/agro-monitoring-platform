import api from './api';
import type { 
  Plot, 
  PlotCreate, 
  PlotUpdate, 
  PlotWithReadings,
  SoilReading,
  VisionData 
} from '@/types/plot';

export interface PlotFilters {
  farm_id?: string;
  status?: string;
  search?: string;
}

/**
 * Plots service - CRUD operations for plots (talhões)
 */
export const plotsService = {
  /**
   * Get all plots, optionally filtered by farm
   */
  async getPlots(filters?: PlotFilters): Promise<Plot[]> {
    const response = await api.get<Plot[]>('/plots/', { params: filters });
    return response.data;
  },

  /**
   * Get plots with current readings and status
   */
  async getPlotsWithReadings(farmId: string): Promise<PlotWithReadings[]> {
    const response = await api.get<PlotWithReadings[]>('/plots/', {
      params: { 
        farm_id: farmId,
        include_readings: true,
      },
    });
    return response.data;
  },

  /**
   * Get plot by ID
   */
  async getPlot(id: string): Promise<Plot> {
    const response = await api.get<Plot>(`/plots/${id}`);
    return response.data;
  },

  /**
   * Get plot with current readings
   */
  async getPlotWithReadings(id: string): Promise<PlotWithReadings> {
    const response = await api.get<PlotWithReadings>(`/plots/${id}`, {
      params: { include_readings: true },
    });
    return response.data;
  },

  /**
   * Create new plot
   */
  async createPlot(data: PlotCreate): Promise<Plot> {
    const response = await api.post<Plot>('/plots/', data);
    return response.data;
  },

  /**
   * Update plot
   */
  async updatePlot(id: string, data: PlotUpdate): Promise<Plot> {
    const response = await api.put<Plot>(`/plots/${id}`, data);
    return response.data;
  },

  /**
   * Delete plot (soft delete)
   */
  async deletePlot(id: string): Promise<void> {
    await api.delete(`/plots/${id}`);
  },

  // ==========================================
  // Sensor Readings
  // ==========================================

  /**
   * Get soil readings for a plot
   */
  async getSoilReadings(
    plotId: string, 
    params?: { 
      start_time?: string; 
      end_time?: string; 
      limit?: number;
    }
  ): Promise<SoilReading[]> {
    const response = await api.get<SoilReading[]>(`/plots/${plotId}/soil-readings`, {
      params,
    });
    return response.data;
  },

  /**
   * Get vision data for a plot
   */
  async getVisionData(
    plotId: string,
    params?: {
      start_time?: string;
      end_time?: string;
      limit?: number;
    }
  ): Promise<VisionData[]> {
    const response = await api.get<VisionData[]>(`/plots/${plotId}/vision-data`, {
      params,
    });
    return response.data;
  },

  /**
   * Get latest soil reading for a plot
   */
  async getLatestSoilReading(plotId: string): Promise<SoilReading | null> {
    const readings = await this.getSoilReadings(plotId, { limit: 1 });
    return readings[0] || null;
  },

  /**
   * Get latest vision data for a plot
   */
  async getLatestVisionData(plotId: string): Promise<VisionData | null> {
    const data = await this.getVisionData(plotId, { limit: 1 });
    return data[0] || null;
  },
};

export default plotsService;
