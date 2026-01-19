import { useState, useEffect, useCallback, useRef } from 'react';
import { plotsService } from '@/services/plotsService';
import { sensorsService } from '@/services/sensorsService';
import type { Plot, SoilReading, VisionData, PlotWithReadings } from '@/types/plot';
import type { Sensor } from '@/types/sensor';

const AUTO_REFRESH_INTERVAL = 30000; // 30 segundos

export type TimePeriod = '10m' | '30m' | '1h' | '6h' | '24h' | '7d';

export const TIME_PERIOD_OPTIONS: { value: TimePeriod; label: string }[] = [
  { value: '10m', label: '10 minutos' },
  { value: '30m', label: '30 minutos' },
  { value: '1h', label: '1 hora' },
  { value: '6h', label: '6 horas' },
  { value: '24h', label: '24 horas' },
  { value: '7d', label: '7 dias' },
];

function getStartTimeFromPeriod(period: TimePeriod): string {
  const now = new Date();
  switch (period) {
    case '10m':
      return new Date(now.getTime() - 10 * 60 * 1000).toISOString();
    case '30m':
      return new Date(now.getTime() - 30 * 60 * 1000).toISOString();
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    case '6h':
      return new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  }
}

interface UsePlotDetailResult {
  plot: PlotWithReadings | null;
  soilReadings: SoilReading[];
  visionData: VisionData[];
  sensors: Sensor[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function usePlotDetail(plotId: string | undefined, period: TimePeriod = '24h'): UsePlotDetailResult {
  const [plot, setPlot] = useState<PlotWithReadings | null>(null);
  const [soilReadings, setSoilReadings] = useState<SoilReading[]>([]);
  const [visionData, setVisionData] = useState<VisionData[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!plotId) {
      setPlot(null);
      setSoilReadings([]);
      setVisionData([]);
      setSensors([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const startTime = getStartTimeFromPeriod(period);
      
      const [plotData, soilData, visionDataResult, sensorsData] = await Promise.all([
        plotsService.getPlot(plotId),
        plotsService.getSoilReadings(plotId, { start_time: startTime, limit: 500 }),
        plotsService.getVisionData(plotId, { start_time: startTime, limit: 100 }),
        sensorsService.getSensors({ plot_id: plotId }),
      ]);

      const latestSoil = soilData[0] || null;
      const latestVision = visionDataResult[0] || null;

      const enrichedPlot: PlotWithReadings = {
        ...plotData,
        status: calculateStatus(latestSoil, latestVision),
        health_score: calculateHealthScore(latestSoil, latestVision),
        current_soil_reading: latestSoil,
        current_vision_data: latestVision,
        sensors_count: sensorsData.length,
        estimated_yield: latestVision?.fruit_count ? latestVision.fruit_count * 0.35 : undefined,
      };

      setPlot(enrichedPlot);
      setSoilReadings(soilData);
      setVisionData(visionDataResult);
      setSensors(sensorsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados do talhao');
    } finally {
      setIsLoading(false);
    }
  }, [plotId, period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh a cada 30 segundos
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!plotId) return;
    
    intervalRef.current = setInterval(() => {
      loadData();
    }, AUTO_REFRESH_INTERVAL);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [plotId, loadData]);

  return {
    plot,
    soilReadings,
    visionData,
    sensors,
    isLoading,
    error,
    refresh: loadData,
  };
}

function calculateStatus(soil: SoilReading | null, vision: VisionData | null): 'ok' | 'warning' | 'critical' | 'offline' {
  if (!soil) return 'offline';

  const moisture = soil.moisture;
  const ph = soil.ph;
  const temp = soil.temperature;

  if (moisture !== null && (moisture < 10 || moisture > 35)) return 'critical';
  if (ph !== null && (ph < 5.5 || ph > 8.0)) return 'critical';
  if (temp !== null && temp > 40) return 'critical';

  if (moisture !== null && (moisture < 15 || moisture > 30)) return 'warning';
  if (ph !== null && (ph < 6.0 || ph > 7.5)) return 'warning';
  if (temp !== null && (temp < 15 || temp > 35)) return 'warning';

  if (vision) {
    if (vision.pests_detected) return 'warning';
    if (vision.irrigation_failures > 0) return 'warning';
    if (vision.water_stress_level !== null && vision.water_stress_level > 70) return 'critical';
  }

  return 'ok';
}

function calculateHealthScore(soil: SoilReading | null, vision: VisionData | null): number {
  if (!soil) return 50;

  let score = 100;

  const moisture = soil.moisture;
  const ph = soil.ph;
  const temp = soil.temperature;

  if (moisture !== null) {
    if (moisture >= 18 && moisture <= 28) {
      // optimal
    } else if (moisture >= 14 && moisture <= 32) {
      score -= 10;
    } else {
      score -= 25;
    }
  }

  if (ph !== null) {
    if (ph >= 6.0 && ph <= 7.5) {
      // optimal
    } else if (ph >= 5.5 && ph <= 8.0) {
      score -= 10;
    } else {
      score -= 25;
    }
  }

  if (temp !== null) {
    if (temp >= 18 && temp <= 32) {
      // optimal
    } else if (temp >= 15 && temp <= 38) {
      score -= 10;
    } else {
      score -= 20;
    }
  }

  if (vision) {
    const ndvi = vision.ndvi;
    if (ndvi !== null) {
      if (ndvi >= 0.6) score += 10;
      else if (ndvi < 0.4) score -= 15;
    }
    if (vision.pests_detected) score -= 15;
    if (vision.irrigation_failures > 0) score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}
