import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { plotsService } from '@/services/plotsService';
import { alertsService } from '@/services/alertsService';
import { eventsService } from '@/services/eventsService';
import { sensorsService } from '@/services/sensorsService';
import type { PlotWithReadings, PlotStatus } from '@/types/plot';
import type { Alert } from '@/types/alert';
import type { Event } from '@/types/event';
import type { SensorHealthIssue } from '@/services/sensorsService';

const AUTO_REFRESH_INTERVAL = 30000; // 30 segundos

export interface FarmStats {
  totalPlots: number;
  okCount: number;
  warningCount: number;
  criticalCount: number;
  offlineCount: number;
  avgMoisture: number;
  avgTemperature: number;
  avgPh: number;
  activeAlerts: number;
  irrigationIssues: number;
  totalTrees: number;
  estimatedYield: number;
  healthScore: number;
}

interface UseFarmDataResult {
  plots: PlotWithReadings[];
  alerts: Alert[];
  events: Event[];
  sensorIssues: SensorHealthIssue[];
  stats: FarmStats;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const defaultStats: FarmStats = {
  totalPlots: 0,
  okCount: 0,
  warningCount: 0,
  criticalCount: 0,
  offlineCount: 0,
  avgMoisture: 0,
  avgTemperature: 0,
  avgPh: 0,
  activeAlerts: 0,
  irrigationIssues: 0,
  totalTrees: 0,
  estimatedYield: 0,
  healthScore: 0,
};

// Calculate plot status based on readings
function calculatePlotStatus(plot: PlotWithReadings): PlotStatus {
  // If status is already provided by backend
  if (plot.status) return plot.status;
  
  // Calculate based on readings
  const soil = plot.current_soil_reading;
  if (!soil) return 'offline';
  
  // Check critical conditions
  if (soil.moisture !== null && (soil.moisture < 10 || soil.moisture > 35)) return 'critical';
  if (soil.ph !== null && (soil.ph < 5.5 || soil.ph > 8.0)) return 'critical';
  if (soil.temperature !== null && soil.temperature > 40) return 'critical';
  
  // Check warning conditions
  if (soil.moisture !== null && (soil.moisture < 15 || soil.moisture > 30)) return 'warning';
  if (soil.ph !== null && (soil.ph < 6.0 || soil.ph > 7.5)) return 'warning';
  if (soil.temperature !== null && (soil.temperature < 15 || soil.temperature > 35)) return 'warning';
  
  return 'ok';
}

// Calculate health score for a plot
function calculateHealthScore(plot: PlotWithReadings): number {
  if (plot.health_score !== undefined) return plot.health_score;
  
  let score = 100;
  const soil = plot.current_soil_reading;
  const vision = plot.current_vision_data;
  
  if (!soil) return 50; // No data = uncertain health
  
  // Moisture scoring
  if (soil.moisture !== null) {
    if (soil.moisture >= 18 && soil.moisture <= 28) score += 0;
    else if (soil.moisture >= 14 && soil.moisture <= 32) score -= 10;
    else score -= 25;
  }
  
  // pH scoring
  if (soil.ph !== null) {
    if (soil.ph >= 6.0 && soil.ph <= 7.5) score += 0;
    else if (soil.ph >= 5.5 && soil.ph <= 8.0) score -= 10;
    else score -= 25;
  }
  
  // Temperature scoring
  if (soil.temperature !== null) {
    if (soil.temperature >= 18 && soil.temperature <= 32) score += 0;
    else if (soil.temperature >= 15 && soil.temperature <= 38) score -= 10;
    else score -= 20;
  }
  
  // Vision data scoring
  if (vision) {
    if (vision.ndvi !== null) {
      if (vision.ndvi >= 0.6) score += 10;
      else if (vision.ndvi >= 0.4) score += 0;
      else score -= 15;
    }
    if (vision.pests_detected) score -= 15;
    if (vision.irrigation_failures > 0) score -= 10;
  }
  
  return Math.max(0, Math.min(100, score));
}

export function useFarmData(farmId: string | null): UseFarmDataResult {
  const [plots, setPlots] = useState<PlotWithReadings[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [sensorIssues, setSensorIssues] = useState<SensorHealthIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!farmId) {
      setPlots([]);
      setAlerts([]);
      setEvents([]);
      setSensorIssues([]);
      setIsLoading(false);
      return;
    }

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const [plotsData, alertsData, eventsData, sensorsData] = await Promise.all([
        plotsService.getPlotsWithReadings(farmId),
        alertsService.getActiveAlerts(farmId),
        eventsService.getRecentEvents(farmId, 10),
        sensorsService.getSensorHealthIssues(farmId),
      ]);

      // Enrich plots with calculated status and health score
      const enrichedPlots = plotsData.map(plot => ({
        ...plot,
        status: plot.status || calculatePlotStatus(plot),
        health_score: plot.health_score ?? calculateHealthScore(plot),
      }));

      setPlots(enrichedPlots);
      setAlerts(alertsData);
      setEvents(eventsData);
      setSensorIssues(sensorsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [farmId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh a cada 30 segundos
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!farmId) return;
    
    intervalRef.current = setInterval(() => {
      loadData(true);
    }, AUTO_REFRESH_INTERVAL);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [farmId, loadData]);

  const refresh = useCallback(() => loadData(true), [loadData]);

  // Calculate stats from plots and alerts
  const stats = useMemo((): FarmStats => {
    if (plots.length === 0) return defaultStats;

    const onlinePlots = plots.filter(p => p.status !== 'offline');
    const avgMoisture = onlinePlots.length > 0
      ? onlinePlots.reduce((sum, p) => sum + (p.current_soil_reading?.moisture ?? 0), 0) / onlinePlots.length
      : 0;
    const avgTemperature = onlinePlots.length > 0
      ? onlinePlots.reduce((sum, p) => sum + (p.current_soil_reading?.temperature ?? 0), 0) / onlinePlots.length
      : 0;
    const avgPh = onlinePlots.length > 0
      ? onlinePlots.reduce((sum, p) => sum + (p.current_soil_reading?.ph ?? 0), 0) / onlinePlots.length
      : 0;
    
    const totalTrees = plots.reduce((sum, p) => sum + (p.tree_count || 0), 0);
    const estimatedYield = plots.reduce((sum, p) => sum + (p.estimated_yield || 0), 0);
    const avgHealth = plots.reduce((sum, p) => sum + (p.health_score || 0), 0) / plots.length;

    return {
      totalPlots: plots.length,
      okCount: plots.filter(p => p.status === 'ok').length,
      warningCount: plots.filter(p => p.status === 'warning').length,
      criticalCount: plots.filter(p => p.status === 'critical').length,
      offlineCount: plots.filter(p => p.status === 'offline').length,
      avgMoisture,
      avgTemperature,
      avgPh,
      activeAlerts: alerts.length,
      irrigationIssues: alerts.filter(a => a.category === 'irrigation').length,
      totalTrees,
      estimatedYield,
      healthScore: Math.round(avgHealth),
    };
  }, [plots, alerts]);

  return {
    plots,
    alerts,
    events,
    sensorIssues,
    stats,
    isLoading,
    isRefreshing,
    error,
    refresh,
  };
}
