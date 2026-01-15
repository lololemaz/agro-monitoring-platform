/**
 * Common types used across the application
 */

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ApiError {
  detail: string | ValidationError[];
  status_code?: number;
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface QueryParams {
  page?: number;
  size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export type Status = 'ok' | 'warning' | 'critical' | 'offline';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export type AlertCategory = 'irrigation' | 'soil' | 'pests' | 'health' | 'production' | 'system';
