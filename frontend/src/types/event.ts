/**
 * Event types based on backend schema
 */

export type EventType = 
  | 'irrigation' 
  | 'fertilization' 
  | 'nutrients' 
  | 'pesticide' 
  | 'pruning' 
  | 'soil_correction' 
  | 'maintenance' 
  | 'harvest'
  | 'other';

export type EventScope = 'farm' | 'plot' | 'subarea' | 'tree_group';

export type EventTag = 'corrective' | 'preventive' | 'experiment' | 'standard';

export interface Event {
  id: string;
  organization_id: string;
  farm_id: string | null;
  plot_id: string | null;
  row_id: string | null;
  type: EventType;
  scope: EventScope;
  scope_id: string | null;
  scope_name: string | null;
  title: string;
  timestamp: string;
  irrigation_data: IrrigationData | null;
  fertilization_data: FertilizationData | null;
  product_data: ProductData | null;
  notes: string | null;
  operator: string | null;
  team: string | null;
  tags: EventTag[];
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  plot_name?: string;
  farm_name?: string;
  attachments?: EventAttachment[];
}

export interface IrrigationData {
  duration_minutes?: number;
  water_volume_liters?: number;
  method?: string;
  notes?: string;
}

export interface FertilizationData {
  product_name?: string;
  quantity_kg?: number;
  application_method?: string;
  npk_ratio?: string;
  notes?: string;
}

export interface ProductData {
  product_name?: string;
  active_ingredient?: string;
  quantity?: number;
  unit?: string;
  application_method?: string;
  safety_interval_days?: number;
  notes?: string;
}

export interface EventAttachment {
  id: string;
  event_id: string;
  name: string;
  type: 'photo' | 'document' | 'invoice';
  url: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface EventCreate {
  farm_id?: string;
  plot_id?: string;
  row_id?: string;
  type: EventType;
  scope: EventScope;
  scope_id?: string;
  scope_name?: string;
  title: string;
  timestamp: string;
  irrigation_data?: IrrigationData;
  fertilization_data?: FertilizationData;
  product_data?: ProductData;
  notes?: string;
  operator?: string;
  team?: string;
  tags?: EventTag[];
}

export interface EventUpdate {
  type?: EventType;
  scope?: EventScope;
  scope_id?: string;
  scope_name?: string;
  title?: string;
  timestamp?: string;
  irrigation_data?: IrrigationData;
  fertilization_data?: FertilizationData;
  product_data?: ProductData;
  notes?: string;
  operator?: string;
  team?: string;
  tags?: EventTag[];
}

export interface EventFilters {
  farm_id?: string;
  plot_id?: string;
  type?: EventType;
  scope?: EventScope;
  start_date?: string;
  end_date?: string;
}
