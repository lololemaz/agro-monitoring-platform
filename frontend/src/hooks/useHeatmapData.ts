import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { sensorsService, type SensorHeatmapData } from '@/services/sensorsService';
import { 
  farmTrees, 
  type TreeData, 
  type HeatmapMetricType, 
  getUniquePlots 
} from '@/data/heatmapData';

const AUTO_REFRESH_INTERVAL = 30000; // 30 segundos

interface UseHeatmapDataResult {
  trees: TreeData[];
  plots: { id: string; name: string }[];
  isLoading: boolean;
  error: string | null;
  isUsingMockData: boolean;
  refresh: () => Promise<void>;
}

function sensorDataToTreeData(sensors: SensorHeatmapData[]): TreeData[] {
  return sensors.map((sensor, index) => {
    const now = new Date();
    const location = sensor.location || {};
    
    const x = location.x ?? (location.lng ? (location.lng + 180) / 360 : (index % 10) / 10);
    const y = location.y ?? (location.lat ? (90 - location.lat) / 180 : Math.floor(index / 10) / 10);

    const metrics = {
      soilMoisture: sensor.metrics.soilMoisture ?? 23,
      temperature: sensor.metrics.temperature ?? 27,
      electricalConductivity: sensor.metrics.electricalConductivity ?? 1.4,
      ph: sensor.metrics.ph ?? 6.8,
      nitrogen: sensor.metrics.nitrogen ?? 35,
      potassium: sensor.metrics.potassium ?? 150,
      phosphorus: sensor.metrics.phosphorus ?? 27,
      chlorophyllIndex: sensor.metrics.chlorophyllIndex ?? 75,
      mangoCount: sensor.metrics.mangoCount ?? 0,
      limeApplication: sensor.metrics.limeApplication ?? 70,
    };

    return {
      id: sensor.sensor_id,
      plotId: sensor.plot_id || 'unknown',
      plotName: sensor.plot_name || 'Sensor',
      row: Math.floor(index / 10),
      col: index % 10,
      x: x,
      y: y,
      variety: 'Sensor',
      lastUpdate: sensor.last_signal_at ? new Date(sensor.last_signal_at) : now,
      metrics,
      isCritical: sensor.is_critical,
      isOutlier: !sensor.is_online,
    };
  });
}

export function useHeatmapData(farmId: string | null): UseHeatmapDataResult {
  const [sensorData, setSensorData] = useState<SensorHeatmapData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState(true);

  const loadData = useCallback(async () => {
    if (!farmId) {
      setIsUsingMockData(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await sensorsService.getHeatmapData(farmId);
      
      if (data.length > 0) {
        setSensorData(data);
        setIsUsingMockData(false);
      } else {
        setIsUsingMockData(true);
      }
    } catch (err) {
      console.error('Failed to load heatmap data:', err);
      setError('Erro ao carregar dados do heatmap');
      setIsUsingMockData(true);
    } finally {
      setIsLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh a cada 30 segundos (apenas se estiver usando dados reais)
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!farmId || isUsingMockData) return;
    
    intervalRef.current = setInterval(() => {
      loadData();
    }, AUTO_REFRESH_INTERVAL);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [farmId, isUsingMockData, loadData]);

  const trees = useMemo(() => {
    if (isUsingMockData) {
      return farmTrees;
    }
    return sensorDataToTreeData(sensorData);
  }, [isUsingMockData, sensorData]);

  const plots = useMemo(() => {
    return getUniquePlots(trees);
  }, [trees]);

  return {
    trees,
    plots,
    isLoading,
    error,
    isUsingMockData,
    refresh: loadData,
  };
}
