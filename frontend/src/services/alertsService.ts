import api from './api';
import type { 
  Alert, 
  AlertCreate, 
  AlertAcknowledge, 
  AlertResolve,
  AlertFilters 
} from '@/types/alert';

/**
 * Alerts service - operations for alerts
 */
export const alertsService = {
  /**
   * Get all alerts, optionally filtered
   */
  async getAlerts(filters?: AlertFilters): Promise<Alert[]> {
    const response = await api.get<Alert[]>('/alerts/', { params: filters });
    return response.data;
  },

  /**
   * Get active (unresolved) alerts
   */
  async getActiveAlerts(farmId?: string): Promise<Alert[]> {
    return this.getAlerts({ 
      farm_id: farmId,
      resolved: false,
    });
  },

  /**
   * Get alert by ID
   */
  async getAlert(id: string): Promise<Alert> {
    const response = await api.get<Alert>(`/alerts/${id}`);
    return response.data;
  },

  /**
   * Create new alert
   */
  async createAlert(data: AlertCreate): Promise<Alert> {
    const response = await api.post<Alert>('/alerts/', data);
    return response.data;
  },

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(id: string, data?: AlertAcknowledge): Promise<Alert> {
    const response = await api.patch<Alert>(`/alerts/${id}/acknowledge`, data);
    return response.data;
  },

  /**
   * Resolve alert
   */
  async resolveAlert(id: string, data?: AlertResolve): Promise<Alert> {
    const response = await api.patch<Alert>(`/alerts/${id}/resolve`, data);
    return response.data;
  },

  /**
   * Get alerts count by severity
   */
  async getAlertsCount(farmId?: string): Promise<{
    total: number;
    critical: number;
    warning: number;
    info: number;
  }> {
    const alerts = await this.getActiveAlerts(farmId);
    return {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      info: alerts.filter(a => a.severity === 'info').length,
    };
  },

  /**
   * Get alerts grouped by category
   */
  async getAlertsByCategory(farmId?: string): Promise<Record<string, Alert[]>> {
    const alerts = await this.getActiveAlerts(farmId);
    return alerts.reduce((acc, alert) => {
      if (!acc[alert.category]) {
        acc[alert.category] = [];
      }
      acc[alert.category].push(alert);
      return acc;
    }, {} as Record<string, Alert[]>);
  },
};

export default alertsService;
