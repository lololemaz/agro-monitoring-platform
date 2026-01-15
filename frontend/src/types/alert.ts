/**
 * Alert types based on backend schema
 */

export type AlertCategory = 'irrigation' | 'soil' | 'pests' | 'health' | 'production' | 'system';
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertSource = 'sensor' | 'vision' | 'manual' | 'system';

export interface Alert {
  id: string;
  organization_id: string;
  farm_id: string | null;
  plot_id: string | null;
  row_id: string | null;
  tree_id: string | null;
  category: AlertCategory;
  severity: AlertSeverity;
  type: string;
  title: string;
  message: string;
  impact: string | null;
  suggested_action: string | null;
  source: AlertSource | null;
  source_id: string | null;
  timestamp: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  recurrence_count: number;
  extra_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined fields
  plot_name?: string;
  farm_name?: string;
}

export interface AlertCreate {
  farm_id?: string;
  plot_id?: string;
  row_id?: string;
  tree_id?: string;
  category: AlertCategory;
  severity: AlertSeverity;
  type: string;
  title: string;
  message: string;
  impact?: string;
  suggested_action?: string;
  source?: AlertSource;
  source_id?: string;
  extra_data?: Record<string, unknown>;
}

export interface AlertAcknowledge {
  notes?: string;
}

export interface AlertResolve {
  resolution_notes?: string;
}

export interface AlertFilters {
  farm_id?: string;
  plot_id?: string;
  category?: AlertCategory;
  severity?: AlertSeverity;
  resolved?: boolean;
  acknowledged?: boolean;
}
