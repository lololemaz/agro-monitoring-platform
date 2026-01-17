/**
 * Analytics types based on backend schema
 */

export type ProductionStage = 
  | 'floracao' 
  | 'frutificacao' 
  | 'crescimento' 
  | 'maturacao' 
  | 'pronto_colheita';

export type RiskLevel = 'baixo' | 'medio' | 'alto' | 'critico';

export type FruitCaliber = 'pequeno' | 'medio' | 'grande' | 'extra_grande';

export interface PlotProductionSnapshot {
  id: string;
  plot_id: string;
  snapshot_date: string;
  status: 'ok' | 'warning' | 'critical' | 'offline';
  health_score: number | null;
  production_stage: ProductionStage | null;
  flowers_per_tree: number | null;
  total_flowers: number | null;
  flowering_percentage: number | null;
  fruits_per_tree: number | null;
  total_fruits: number | null;
  avg_fruit_size: number | null;
  fruit_caliber: FruitCaliber | null;
  estimated_yield_kg: number | null;
  estimated_yield_tons: number | null;
  harvest_start_date: string | null;
  harvest_end_date: string | null;
  days_to_harvest: number | null;
  risk_level: RiskLevel | null;
  risk_factors: string[];
  last_soil_reading_id: string | null;
  last_vision_data_id: string | null;
  extra_data: Record<string, unknown>;
  created_at: string;
  // Joined fields
  plot_name?: string;
  plot_code?: string;
}

export interface SnapshotCreate {
  plot_id: string;
  snapshot_date: string;
  status?: 'ok' | 'warning' | 'critical' | 'offline';
  health_score?: number;
  production_stage?: ProductionStage;
  flowers_per_tree?: number;
  total_flowers?: number;
  flowering_percentage?: number;
  fruits_per_tree?: number;
  total_fruits?: number;
  avg_fruit_size?: number;
  fruit_caliber?: FruitCaliber;
  estimated_yield_kg?: number;
  estimated_yield_tons?: number;
  harvest_start_date?: string;
  harvest_end_date?: string;
  days_to_harvest?: number;
  risk_level?: RiskLevel;
  risk_factors?: string[];
  extra_data?: Record<string, unknown>;
}

export interface AnalyticsFilters {
  farm_id?: string;
  plot_id?: string;
  start_date?: string;
  end_date?: string;
  production_stage?: ProductionStage;
}

export interface FarmSummary {
  farm_id: string;
  farm_name: string;
  total_area: number | null;
  total_plots: number;
  total_trees: number;
  total_sensors: number;
  sensors_online: number;
  sensors_offline: number;
  plots_ok: number;
  plots_warning: number;
  plots_critical: number;
  plots_offline: number;
  active_alerts: number;
  critical_alerts: number;
  warning_alerts: number;
  avg_moisture: number | null;
  avg_temperature: number | null;
  avg_ph: number | null;
  health_score: number;
  estimated_yield_kg: number;
}
