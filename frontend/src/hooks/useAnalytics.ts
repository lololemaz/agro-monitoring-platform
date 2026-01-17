import { useState, useEffect, useCallback } from 'react';
import { analyticsService } from '@/services/analyticsService';
import { farmsService } from '@/services/farmsService';
import type { PlotProductionSnapshot, FarmSummary } from '@/types/analytics';

export interface PlotProduction {
  plotId: string;
  plotName: string;
  plotCode: string | null;
  status: 'ok' | 'warning' | 'critical' | 'offline';
  healthScore: number;
  productionStage: string | null;
  totalFruits: number;
  avgFruitSize: number | null;
  fruitCaliber: string | null;
  estimatedYieldKg: number;
  estimatedYieldTons: number;
  daysToHarvest: number | null;
  harvestStartDate: string | null;
  harvestEndDate: string | null;
  riskLevel: string | null;
  riskFactors: string[];
  floweringPercentage: number | null;
}

export interface FarmProductionStats {
  totalPlots: number;
  totalTrees: number;
  totalFruits: number;
  avgFruitsPerTree: number;
  totalEstimatedYieldKg: number;
  totalEstimatedYieldTons: number;
  avgHealthScore: number;
  plotsByStage: Record<string, number>;
  plotsByRisk: Record<string, number>;
  harvestReady: number;
  inProgress: number;
}

interface UseAnalyticsResult {
  snapshots: PlotProductionSnapshot[];
  plotProductions: PlotProduction[];
  farmStats: FarmProductionStats;
  farmSummary: FarmSummary | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const defaultStats: FarmProductionStats = {
  totalPlots: 0,
  totalTrees: 0,
  totalFruits: 0,
  avgFruitsPerTree: 0,
  totalEstimatedYieldKg: 0,
  totalEstimatedYieldTons: 0,
  avgHealthScore: 0,
  plotsByStage: {},
  plotsByRisk: {},
  harvestReady: 0,
  inProgress: 0,
};

export function useAnalytics(farmId: string | null): UseAnalyticsResult {
  const [snapshots, setSnapshots] = useState<PlotProductionSnapshot[]>([]);
  const [farmSummary, setFarmSummary] = useState<FarmSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!farmId) {
      setSnapshots([]);
      setFarmSummary(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [latestSnapshots, summary] = await Promise.all([
        analyticsService.getLatestSnapshots(farmId),
        analyticsService.getFarmSummary(farmId),
      ]);

      setSnapshots(latestSnapshots);
      setFarmSummary(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar analytics');
    } finally {
      setIsLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const plotProductions: PlotProduction[] = snapshots.map(snapshot => ({
    plotId: snapshot.plot_id,
    plotName: snapshot.plot_name || 'Talhao',
    plotCode: snapshot.plot_code || null,
    status: (snapshot.status as 'ok' | 'warning' | 'critical' | 'offline') || 'offline',
    healthScore: snapshot.health_score ? Number(snapshot.health_score) : 0,
    productionStage: snapshot.production_stage || null,
    totalFruits: snapshot.total_fruits || 0,
    avgFruitSize: snapshot.avg_fruit_size ? Number(snapshot.avg_fruit_size) : null,
    fruitCaliber: snapshot.fruit_caliber || null,
    estimatedYieldKg: snapshot.estimated_yield_kg ? Number(snapshot.estimated_yield_kg) : 0,
    estimatedYieldTons: snapshot.estimated_yield_tons ? Number(snapshot.estimated_yield_tons) : 0,
    daysToHarvest: snapshot.days_to_harvest ?? null,
    harvestStartDate: snapshot.harvest_start_date || null,
    harvestEndDate: snapshot.harvest_end_date || null,
    riskLevel: snapshot.risk_level || null,
    riskFactors: snapshot.risk_factors || [],
    floweringPercentage: snapshot.flowering_percentage ? Number(snapshot.flowering_percentage) : null,
  }));

  const farmStats: FarmProductionStats = (() => {
    if (plotProductions.length === 0) return defaultStats;

    const plotsByStage: Record<string, number> = {};
    const plotsByRisk: Record<string, number> = {};
    let totalFruits = 0;
    let totalYieldKg = 0;
    let totalHealthScore = 0;
    let harvestReady = 0;
    let inProgress = 0;

    for (const plot of plotProductions) {
      totalFruits += plot.totalFruits;
      totalYieldKg += plot.estimatedYieldKg;
      totalHealthScore += plot.healthScore;

      if (plot.productionStage) {
        plotsByStage[plot.productionStage] = (plotsByStage[plot.productionStage] || 0) + 1;
        if (plot.productionStage === 'pronto_colheita') {
          harvestReady++;
        } else if (['maturacao', 'crescimento', 'frutificacao'].includes(plot.productionStage)) {
          inProgress++;
        }
      }

      if (plot.riskLevel) {
        plotsByRisk[plot.riskLevel] = (plotsByRisk[plot.riskLevel] || 0) + 1;
      }
    }

    const totalTrees = farmSummary?.total_trees || 0;

    return {
      totalPlots: plotProductions.length,
      totalTrees,
      totalFruits,
      avgFruitsPerTree: totalTrees > 0 ? totalFruits / totalTrees : 0,
      totalEstimatedYieldKg: totalYieldKg,
      totalEstimatedYieldTons: totalYieldKg / 1000,
      avgHealthScore: plotProductions.length > 0 ? totalHealthScore / plotProductions.length : 0,
      plotsByStage,
      plotsByRisk,
      harvestReady,
      inProgress,
    };
  })();

  return {
    snapshots,
    plotProductions,
    farmStats,
    farmSummary,
    isLoading,
    error,
    refresh: loadData,
  };
}
