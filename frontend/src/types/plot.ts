/**
 * Plot (Talhão) types based on backend schema
 */

export type PlotStatus = 'ok' | 'warning' | 'critical' | 'offline';

export interface PlotCoordinates {
  latitude?: number;
  longitude?: number;
  polygon?: [number, number][]; // Array de [lat, lng]
}

export interface Plot {
  id: string;
  farm_id: string;
  name: string;
  code: string | null;
  area: number;
  crop_type: string;
  variety: string | null;
  planting_date: string | null;
  season: string | null;
  row_count: number;
  tree_count: number;
  coordinates: PlotCoordinates | null;
  grid_position: {
    row: number;
    col: number;
  } | null;
  extra_data: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface PlotCreate {
  farm_id: string;
  name: string;
  code?: string;
  area: number;
  crop_type?: string;
  variety?: string;
  planting_date?: string;
  season?: string;
  row_count?: number;
  tree_count?: number;
  coordinates?: PlotCoordinates;
  grid_position?: {
    row: number;
    col: number;
  };
  extra_data?: Record<string, unknown>;
}

export interface PlotUpdate {
  name?: string;
  code?: string;
  area?: number;
  crop_type?: string;
  variety?: string;
  planting_date?: string;
  season?: string;
  row_count?: number;
  tree_count?: number;
  coordinates?: PlotCoordinates;
  grid_position?: {
    row: number;
    col: number;
  };
  extra_data?: Record<string, unknown>;
  is_active?: boolean;
}

export interface PlotWithReadings extends Plot {
  status?: PlotStatus;
  health_score?: number;
  current_soil_reading?: SoilReading | null;
  current_vision_data?: VisionData | null;
  sensors_count?: number;
  estimated_yield?: number;
}

export interface SoilReading {
  time: string;
  sensor_id: string;
  plot_id: string;
  moisture: number | null;
  temperature: number | null;
  ec: number | null;
  ph: number | null;
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
  extra_data: Record<string, unknown>;
}

export interface VisionData {
  time: string;
  sensor_id: string;
  plot_id: string;
  irrigation_failures: number;
  water_stress_level: number | null;
  over_irrigation_detected: boolean;
  blocked_lines: number;
  fruit_count: number;
  avg_fruit_size: number | null;
  flowering_percentage: number | null;
  pests_detected: boolean;
  pest_type: string | null;
  fallen_fruits: number;
  chlorophyll_level: number | null;
  ndvi: number | null;
  vegetative_stress: number | null;
  maturity_index: number | null;
  image_urls: string[];
  extra_data: Record<string, unknown>;
}
