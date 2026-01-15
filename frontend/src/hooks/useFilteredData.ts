import { useMemo } from 'react';
import { Plot } from '@/data/mockData';
import { PlotProduction } from '@/data/analyticsData';
import { GlobalFilters } from '@/types/filters';

// Helper to get production stage from plot data
function getPlotProductionStage(plot: Plot): string {
  const maturity = plot.currentVisionData.maturityIndex;
  const flowering = plot.currentVisionData.floweringPercentage;
  
  if (maturity >= 80) return 'harvest_ready';
  if (maturity >= 50) return 'maturation';
  if (maturity >= 20) return 'growth';
  if (flowering >= 50) return 'fruit_setting';
  return 'flowering';
}

// Helper to get criticality from plot status
function getPlotCriticality(plot: Plot): string {
  if (plot.status === 'critical') return 'critical';
  if (plot.status === 'warning') return 'attention';
  if (plot.status === 'offline') return 'emergency';
  return 'normal';
}

// Helper to get irrigation status
function getIrrigationStatus(plot: Plot): string {
  const moisture = plot.currentSoilReading.moisture;
  if (moisture < 15) return 'under';
  if (moisture > 30) return 'excessive';
  return 'optimal';
}

// Helper to get fruit caliber
function getFruitCaliber(avgSize: number): string {
  if (avgSize < 60) return 'small';
  if (avgSize < 80) return 'medium';
  if (avgSize < 100) return 'large';
  return 'extra_large';
}

// Main filter function for plots
export function filterPlots(plots: Plot[], filters: GlobalFilters): Plot[] {
  return plots.filter(plot => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!plot.name.toLowerCase().includes(searchLower) &&
          !plot.id.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Plot filter
    if (filters.plots.length > 0 && !filters.plots.includes(plot.id)) {
      return false;
    }

    // Variety filter (simulated - in real app, plots would have variety)
    if (filters.varieties.length > 0) {
      // Simulate variety based on plot ID hash
      const varieties = ['tommy_atkins', 'kent', 'keitt', 'palmer', 'haden'];
      const plotVariety = varieties[parseInt(plot.id.replace('T', '')) % varieties.length];
      if (!filters.varieties.includes(plotVariety as any)) return false;
    }

    // Production stage filter
    if (filters.productionStages.length > 0) {
      const stage = getPlotProductionStage(plot);
      if (!filters.productionStages.includes(stage as any)) return false;
    }

    // Criticality filter
    if (filters.criticalityLevels.length > 0) {
      const criticality = getPlotCriticality(plot);
      if (!filters.criticalityLevels.includes(criticality as any)) return false;
    }

    // Caliber filter
    if (filters.calibers.length > 0) {
      const caliber = getFruitCaliber(plot.currentVisionData.avgFruitSize);
      if (!filters.calibers.includes(caliber as any)) return false;
    }

    // Irrigation status filter
    if (filters.irrigationStatus.length > 0) {
      const status = getIrrigationStatus(plot);
      if (!filters.irrigationStatus.includes(status as any)) return false;
    }

    // Yield range filter
    if (filters.yieldRange.min && plot.estimatedYield < filters.yieldRange.min) {
      return false;
    }
    if (filters.yieldRange.max && plot.estimatedYield > filters.yieldRange.max) {
      return false;
    }

    // Moisture range filter
    if (filters.moistureRange.min && plot.currentSoilReading.moisture < filters.moistureRange.min) {
      return false;
    }
    if (filters.moistureRange.max && plot.currentSoilReading.moisture > filters.moistureRange.max) {
      return false;
    }

    // pH range filter
    if (filters.phRange.min && plot.currentSoilReading.ph < filters.phRange.min) {
      return false;
    }
    if (filters.phRange.max && plot.currentSoilReading.ph > filters.phRange.max) {
      return false;
    }

    return true;
  });
}

// Hook for filtering plots with memoization
export function useFilteredPlots(plots: Plot[], filters: GlobalFilters): Plot[] {
  return useMemo(() => filterPlots(plots, filters), [plots, filters]);
}

// Filter analytics data
export function filterAnalyticsData(data: PlotProduction[], filters: GlobalFilters): PlotProduction[] {
  return data.filter(plot => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!plot.plotName.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Production stage filter
    if (filters.productionStages.length > 0) {
      if (!filters.productionStages.includes(plot.productionStage as any)) {
        return false;
      }
    }

    // Caliber filter
    if (filters.calibers.length > 0) {
      if (!filters.calibers.includes(plot.fruitCaliber as any)) {
        return false;
      }
    }

    // Harvest window filter
    if (filters.harvestWindow !== 'all') {
      const days = parseInt(filters.harvestWindow);
      if (plot.daysToHarvest > days) return false;
    }

    // Yield range filter
    if (filters.yieldRange.min && plot.estimatedYieldKg < filters.yieldRange.min) {
      return false;
    }
    if (filters.yieldRange.max && plot.estimatedYieldKg > filters.yieldRange.max) {
      return false;
    }

    return true;
  });
}

// Hook for filtering analytics data
export function useFilteredAnalyticsData(data: PlotProduction[], filters: GlobalFilters): PlotProduction[] {
  return useMemo(() => filterAnalyticsData(data, filters), [data, filters]);
}

// Calculate filter summary stats
export interface FilterSummary {
  totalPlots: number;
  filteredPlots: number;
  totalTrees: number;
  filteredTrees: number;
  totalYield: number;
  filteredYield: number;
}

export function calculateFilterSummary(
  allPlots: Plot[], 
  filteredPlots: Plot[]
): FilterSummary {
  return {
    totalPlots: allPlots.length,
    filteredPlots: filteredPlots.length,
    totalTrees: allPlots.reduce((sum, p) => sum + p.treeCount, 0),
    filteredTrees: filteredPlots.reduce((sum, p) => sum + p.treeCount, 0),
    totalYield: allPlots.reduce((sum, p) => sum + p.estimatedYield, 0),
    filteredYield: filteredPlots.reduce((sum, p) => sum + p.estimatedYield, 0),
  };
}
