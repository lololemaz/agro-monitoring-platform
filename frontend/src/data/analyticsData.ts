import { mockFarm, Plot, Status } from './mockData';

// Production stages for agricultural cycle
export type ProductionStage = 
  | 'floração' 
  | 'frutificação' 
  | 'crescimento' 
  | 'maturação' 
  | 'pronto_colheita';

export const productionStageLabels: Record<ProductionStage, string> = {
  'floração': 'Floração',
  'frutificação': 'Frutificação',
  'crescimento': 'Crescimento',
  'maturação': 'Maturação',
  'pronto_colheita': 'Pronto p/ Colheita',
};

export const productionStageColors: Record<ProductionStage, string> = {
  'floração': 'hsl(300, 70%, 60%)',
  'frutificação': 'hsl(45, 90%, 55%)',
  'crescimento': 'hsl(120, 60%, 50%)',
  'maturação': 'hsl(25, 85%, 55%)',
  'pronto_colheita': 'hsl(0, 75%, 55%)',
};

export type FruitCaliber = 'pequeno' | 'médio' | 'grande' | 'extra_grande';

export const caliberLabels: Record<FruitCaliber, string> = {
  'pequeno': 'Pequeno (<200g)',
  'médio': 'Médio (200-350g)',
  'grande': 'Grande (350-500g)',
  'extra_grande': 'Extra Grande (>500g)',
};

export type RiskLevel = 'baixo' | 'médio' | 'alto' | 'crítico';

export const riskLevelLabels: Record<RiskLevel, string> = {
  'baixo': 'Baixo',
  'médio': 'Médio',
  'alto': 'Alto',
  'crítico': 'Crítico',
};

// Enhanced plot with production data
export interface PlotProduction {
  plotId: string;
  plotName: string;
  area: number;
  treeCount: number;
  status: Status;
  healthScore: number;
  productionStage: ProductionStage;
  // Flower data
  flowersPerTree: number;
  totalFlowers: number;
  floweringPercentage: number;
  // Fruit data
  fruitsPerTree: number;
  totalFruits: number;
  avgFruitSize: number; // grams
  fruitCaliber: FruitCaliber;
  // Yield
  estimatedYieldKg: number;
  estimatedYieldTons: number;
  // Harvest
  harvestStartDate: Date;
  harvestEndDate: Date;
  daysToHarvest: number;
  // Risk
  riskLevel: RiskLevel;
  riskFactors: string[];
  // Coordinates for heatmap
  gridPosition: { row: number; col: number };
}

// Harvest forecast data
export interface HarvestForecast {
  weekLabel: string;
  startDate: Date;
  endDate: Date;
  expectedFruits: number;
  expectedYieldKg: number;
  expectedYieldTons: number;
  plotCount: number;
  calibers: {
    pequeno: number;
    médio: number;
    grande: number;
    extra_grande: number;
  };
}

// Time series for charts
export interface ProductionTimeSeries {
  date: Date;
  label: string;
  totalFlowers: number;
  totalFruits: number;
  yieldKg: number;
  yieldTons: number;
  conversionRate: number;
}

// Farm-level aggregations
export interface FarmProductionStats {
  // By stage
  plotsByStage: Record<ProductionStage, number>;
  treesByStage: Record<ProductionStage, number>;
  // Totals
  totalTrees: number;
  totalFlowers: number;
  totalFruits: number;
  avgFlowersPerTree: number;
  avgFruitsPerTree: number;
  // Yield
  totalEstimatedYieldKg: number;
  totalEstimatedYieldTons: number;
  // Harvest
  harvestNext7Days: number;
  harvestNext14Days: number;
  harvestNext30Days: number;
  harvestNext60Days: number;
  // Calibers
  caliberDistribution: Record<FruitCaliber, number>;
  // Risk
  plotsByRisk: Record<RiskLevel, number>;
  variabilityIndex: number;
}

// Generate production stage based on maturity index
function getProductionStage(maturityIndex: number, floweringPercentage: number): ProductionStage {
  if (floweringPercentage > 70 && maturityIndex < 20) return 'floração';
  if (maturityIndex < 30) return 'frutificação';
  if (maturityIndex < 55) return 'crescimento';
  if (maturityIndex < 80) return 'maturação';
  return 'pronto_colheita';
}

// Get fruit caliber based on size
function getFruitCaliber(avgSize: number): FruitCaliber {
  if (avgSize < 200) return 'pequeno';
  if (avgSize < 350) return 'médio';
  if (avgSize < 500) return 'grande';
  return 'extra_grande';
}

// Calculate risk level
function getRiskLevel(plot: Plot): { level: RiskLevel; factors: string[] } {
  const factors: string[] = [];
  let riskScore = 0;

  if (plot.healthScore < 50) {
    riskScore += 3;
    factors.push('Saúde crítica');
  } else if (plot.healthScore < 70) {
    riskScore += 1;
    factors.push('Saúde comprometida');
  }

  if (plot.currentVisionData.waterStressLevel > 70) {
    riskScore += 2;
    factors.push('Estresse hídrico alto');
  }

  if (plot.currentVisionData.pestsDetected) {
    riskScore += 2;
    factors.push('Pragas detectadas');
  }

  if (plot.currentVisionData.irrigationFailures > 0) {
    riskScore += 2;
    factors.push('Falha na irrigação');
  }

  if (plot.currentVisionData.fallenFruits > 50) {
    riskScore += 1;
    factors.push('Queda de frutos');
  }

  if (riskScore >= 5) return { level: 'crítico', factors };
  if (riskScore >= 3) return { level: 'alto', factors };
  if (riskScore >= 1) return { level: 'médio', factors };
  return { level: 'baixo', factors };
}

// Generate production data for each plot
export function generatePlotProductions(): PlotProduction[] {
  const gridCols = 10;
  
  return mockFarm.plots.map((plot, index) => {
    const productionStage = getProductionStage(
      plot.currentVisionData.maturityIndex,
      plot.currentVisionData.floweringPercentage
    );
    
    const flowersPerTree = Math.round(150 + Math.random() * 200);
    const fruitsPerTree = Math.round(plot.currentVisionData.fruitCount / plot.treeCount);
    const avgFruitSize = 180 + Math.random() * 250; // grams
    
    const { level: riskLevel, factors: riskFactors } = getRiskLevel(plot);
    
    // Calculate harvest dates based on stage
    const now = new Date();
    let daysToHarvest: number;
    switch (productionStage) {
      case 'floração': daysToHarvest = 90 + Math.random() * 30; break;
      case 'frutificação': daysToHarvest = 60 + Math.random() * 30; break;
      case 'crescimento': daysToHarvest = 30 + Math.random() * 30; break;
      case 'maturação': daysToHarvest = 7 + Math.random() * 21; break;
      case 'pronto_colheita': daysToHarvest = Math.random() * 7; break;
    }
    
    const harvestStartDate = new Date(now.getTime() + daysToHarvest * 24 * 60 * 60 * 1000);
    const harvestEndDate = new Date(harvestStartDate.getTime() + (7 + Math.random() * 14) * 24 * 60 * 60 * 1000);
    
    return {
      plotId: plot.id,
      plotName: plot.name,
      area: plot.area,
      treeCount: plot.treeCount,
      status: plot.status,
      healthScore: plot.healthScore,
      productionStage,
      flowersPerTree,
      totalFlowers: flowersPerTree * plot.treeCount,
      floweringPercentage: plot.currentVisionData.floweringPercentage,
      fruitsPerTree,
      totalFruits: plot.currentVisionData.fruitCount,
      avgFruitSize,
      fruitCaliber: getFruitCaliber(avgFruitSize),
      estimatedYieldKg: plot.estimatedYield,
      estimatedYieldTons: plot.estimatedYield / 1000,
      harvestStartDate,
      harvestEndDate,
      daysToHarvest: Math.round(daysToHarvest),
      riskLevel,
      riskFactors,
      gridPosition: {
        row: Math.floor(index / gridCols),
        col: index % gridCols,
      },
    };
  });
}

// Generate harvest forecast
export function generateHarvestForecast(): HarvestForecast[] {
  const plots = generatePlotProductions();
  const now = new Date();
  const forecasts: HarvestForecast[] = [];
  
  // Generate 12 weeks of forecast
  for (let week = 0; week < 12; week++) {
    const startDate = new Date(now.getTime() + week * 7 * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    
    const plotsInWindow = plots.filter(p => 
      p.harvestStartDate >= startDate && p.harvestStartDate <= endDate
    );
    
    const calibers = {
      pequeno: 0,
      médio: 0,
      grande: 0,
      extra_grande: 0,
    };
    
    plotsInWindow.forEach(p => {
      calibers[p.fruitCaliber] += p.totalFruits;
    });
    
    forecasts.push({
      weekLabel: `Semana ${week + 1}`,
      startDate,
      endDate,
      expectedFruits: plotsInWindow.reduce((sum, p) => sum + p.totalFruits, 0),
      expectedYieldKg: plotsInWindow.reduce((sum, p) => sum + p.estimatedYieldKg, 0),
      expectedYieldTons: plotsInWindow.reduce((sum, p) => sum + p.estimatedYieldTons, 0),
      plotCount: plotsInWindow.length,
      calibers,
    });
  }
  
  return forecasts;
}

// Generate time series for production evolution
export function generateProductionTimeSeries(): ProductionTimeSeries[] {
  const series: ProductionTimeSeries[] = [];
  const now = new Date();
  
  // Generate 30 days of historical + 30 days forecast
  for (let day = -30; day <= 30; day++) {
    const date = new Date(now.getTime() + day * 24 * 60 * 60 * 1000);
    const dayOfMonth = date.getDate();
    const month = date.toLocaleDateString('pt-BR', { month: 'short' });
    
    // Simulate growth curve
    const progress = (day + 30) / 60; // 0 to 1
    const baseFlowers = 8000000 * (1 - progress * 0.7); // Decreasing flowers
    const baseFruits = 5000000 * Math.min(1, progress * 1.5); // Increasing fruits
    const conversionRate = baseFruits / (baseFlowers + baseFruits) * 100;
    
    series.push({
      date,
      label: `${dayOfMonth} ${month}`,
      totalFlowers: Math.round(baseFlowers + (Math.random() - 0.5) * 500000),
      totalFruits: Math.round(baseFruits + (Math.random() - 0.5) * 300000),
      yieldKg: Math.round(baseFruits * 0.35 / 1000), // ~350g per fruit
      yieldTons: Math.round(baseFruits * 0.35 / 1000000),
      conversionRate: Math.round(conversionRate * 10) / 10,
    });
  }
  
  return series;
}

// Calculate farm-level statistics
export function getFarmProductionStats(): FarmProductionStats {
  const plots = generatePlotProductions();
  const now = new Date();
  
  const plotsByStage: Record<ProductionStage, number> = {
    'floração': 0,
    'frutificação': 0,
    'crescimento': 0,
    'maturação': 0,
    'pronto_colheita': 0,
  };
  
  const treesByStage: Record<ProductionStage, number> = {
    'floração': 0,
    'frutificação': 0,
    'crescimento': 0,
    'maturação': 0,
    'pronto_colheita': 0,
  };
  
  const caliberDistribution: Record<FruitCaliber, number> = {
    'pequeno': 0,
    'médio': 0,
    'grande': 0,
    'extra_grande': 0,
  };
  
  const plotsByRisk: Record<RiskLevel, number> = {
    'baixo': 0,
    'médio': 0,
    'alto': 0,
    'crítico': 0,
  };
  
  let totalFlowers = 0;
  let totalFruits = 0;
  let totalTrees = 0;
  let totalYieldKg = 0;
  let harvestNext7Days = 0;
  let harvestNext14Days = 0;
  let harvestNext30Days = 0;
  let harvestNext60Days = 0;
  
  plots.forEach(plot => {
    plotsByStage[plot.productionStage]++;
    treesByStage[plot.productionStage] += plot.treeCount;
    caliberDistribution[plot.fruitCaliber] += plot.totalFruits;
    plotsByRisk[plot.riskLevel]++;
    
    totalFlowers += plot.totalFlowers;
    totalFruits += plot.totalFruits;
    totalTrees += plot.treeCount;
    totalYieldKg += plot.estimatedYieldKg;
    
    if (plot.daysToHarvest <= 7) harvestNext7Days += plot.estimatedYieldKg;
    if (plot.daysToHarvest <= 14) harvestNext14Days += plot.estimatedYieldKg;
    if (plot.daysToHarvest <= 30) harvestNext30Days += plot.estimatedYieldKg;
    if (plot.daysToHarvest <= 60) harvestNext60Days += plot.estimatedYieldKg;
  });
  
  // Calculate variability index (coefficient of variation of yields)
  const yields = plots.map(p => p.estimatedYieldKg);
  const avgYield = yields.reduce((a, b) => a + b, 0) / yields.length;
  const variance = yields.reduce((sum, y) => sum + Math.pow(y - avgYield, 2), 0) / yields.length;
  const stdDev = Math.sqrt(variance);
  const variabilityIndex = (stdDev / avgYield) * 100;
  
  return {
    plotsByStage,
    treesByStage,
    totalTrees,
    totalFlowers,
    totalFruits,
    avgFlowersPerTree: Math.round(totalFlowers / totalTrees),
    avgFruitsPerTree: Math.round(totalFruits / totalTrees),
    totalEstimatedYieldKg: totalYieldKg,
    totalEstimatedYieldTons: totalYieldKg / 1000,
    harvestNext7Days,
    harvestNext14Days,
    harvestNext30Days,
    harvestNext60Days,
    caliberDistribution,
    plotsByRisk,
    variabilityIndex: Math.round(variabilityIndex * 10) / 10,
  };
}

// Export singleton data
export const plotProductions = generatePlotProductions();
export const harvestForecasts = generateHarvestForecast();
export const productionTimeSeries = generateProductionTimeSeries();
export const farmProductionStats = getFarmProductionStats();
