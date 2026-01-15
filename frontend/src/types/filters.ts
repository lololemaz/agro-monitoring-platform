// Global Filter Types and Definitions

// Mango Varieties
export type MangoVariety = 'tommy_atkins' | 'kent' | 'keitt' | 'palmer' | 'haden' | 'other';

export const mangoVarietyConfig: Record<MangoVariety, { label: string; color: string }> = {
  tommy_atkins: { label: 'Tommy Atkins', color: 'hsl(0, 70%, 50%)' },
  kent: { label: 'Kent', color: 'hsl(35, 80%, 50%)' },
  keitt: { label: 'Keitt', color: 'hsl(120, 60%, 40%)' },
  palmer: { label: 'Palmer', color: 'hsl(270, 60%, 50%)' },
  haden: { label: 'Haden', color: 'hsl(45, 90%, 50%)' },
  other: { label: 'Outras', color: 'hsl(200, 20%, 50%)' },
};

// Production Stages
export type ProductionStage = 'flowering' | 'fruit_setting' | 'growth' | 'maturation' | 'harvest_ready';

export const productionStageConfig: Record<ProductionStage, { 
  label: string; 
  color: string; 
  bgColor: string;
  description: string;
}> = {
  flowering: { 
    label: 'Floração', 
    color: 'hsl(330, 80%, 60%)', 
    bgColor: 'hsl(330, 80%, 95%)',
    description: 'Período de florescimento das árvores'
  },
  fruit_setting: { 
    label: 'Frutificação', 
    color: 'hsl(45, 90%, 50%)', 
    bgColor: 'hsl(45, 90%, 95%)',
    description: 'Formação inicial dos frutos após polinização'
  },
  growth: { 
    label: 'Crescimento', 
    color: 'hsl(120, 60%, 45%)', 
    bgColor: 'hsl(120, 60%, 95%)',
    description: 'Desenvolvimento e crescimento dos frutos'
  },
  maturation: { 
    label: 'Maturação', 
    color: 'hsl(35, 85%, 50%)', 
    bgColor: 'hsl(35, 85%, 95%)',
    description: 'Amadurecimento dos frutos'
  },
  harvest_ready: { 
    label: 'Pronto p/ Colheita', 
    color: 'hsl(15, 90%, 50%)', 
    bgColor: 'hsl(15, 90%, 95%)',
    description: 'Frutos prontos para serem colhidos'
  },
};

// Criticality Levels
export type CriticalityLevel = 'normal' | 'attention' | 'critical' | 'emergency';

export const criticalityConfig: Record<CriticalityLevel, { 
  label: string; 
  color: string; 
  bgColor: string;
  description: string;
}> = {
  normal: { 
    label: 'Normal', 
    color: 'hsl(var(--status-ok))', 
    bgColor: 'hsl(var(--status-ok-bg))',
    description: 'Condições dentro dos parâmetros ideais'
  },
  attention: { 
    label: 'Atenção', 
    color: 'hsl(var(--status-warning))', 
    bgColor: 'hsl(var(--status-warning-bg))',
    description: 'Requer monitoramento próximo'
  },
  critical: { 
    label: 'Crítico', 
    color: 'hsl(var(--status-critical))', 
    bgColor: 'hsl(var(--status-critical-bg))',
    description: 'Ação imediata recomendada'
  },
  emergency: { 
    label: 'Emergência', 
    color: 'hsl(0, 90%, 40%)', 
    bgColor: 'hsl(0, 90%, 95%)',
    description: 'Situação de emergência - ação urgente'
  },
};

// Irrigation Status
export type IrrigationStatus = 'under' | 'optimal' | 'excessive';

export const irrigationStatusConfig: Record<IrrigationStatus, { label: string; color: string }> = {
  under: { label: 'Abaixo do ideal', color: 'hsl(var(--status-warning))' },
  optimal: { label: 'Ótimo', color: 'hsl(var(--status-ok))' },
  excessive: { label: 'Excessivo', color: 'hsl(var(--chart-moisture))' },
};

// Fertilization Status
export type FertilizationStatus = 'recent' | 'scheduled' | 'overdue';

export const fertilizationStatusConfig: Record<FertilizationStatus, { label: string; color: string }> = {
  recent: { label: 'Recente', color: 'hsl(var(--status-ok))' },
  scheduled: { label: 'Agendada', color: 'hsl(var(--primary))' },
  overdue: { label: 'Atrasada', color: 'hsl(var(--status-warning))' },
};

// Fruit Caliber
export type FruitCaliber = 'small' | 'medium' | 'large' | 'extra_large';

export const fruitCaliberConfig: Record<FruitCaliber, { label: string; minMm: number; maxMm: number }> = {
  small: { label: 'Pequeno (<60mm)', minMm: 0, maxMm: 60 },
  medium: { label: 'Médio (60-80mm)', minMm: 60, maxMm: 80 },
  large: { label: 'Grande (80-100mm)', minMm: 80, maxMm: 100 },
  extra_large: { label: 'Extra Grande (>100mm)', minMm: 100, maxMm: 999 },
};

// Harvest Window
export type HarvestWindow = 'all' | '7d' | '14d' | '30d' | '60d';

export const harvestWindowConfig: Record<HarvestWindow, { label: string; days: number | null }> = {
  all: { label: 'Todos', days: null },
  '7d': { label: 'Próximos 7 dias', days: 7 },
  '14d': { label: 'Próximos 14 dias', days: 14 },
  '30d': { label: 'Próximos 30 dias', days: 30 },
  '60d': { label: 'Próximos 60 dias', days: 60 },
};

// Date Range Presets
export type DateRangePreset = 'today' | 'yesterday' | 'last_7d' | 'last_14d' | 'last_30d' | 'last_90d' | 'custom';

export const dateRangePresetConfig: Record<DateRangePreset, { label: string }> = {
  today: { label: 'Hoje' },
  yesterday: { label: 'Ontem' },
  last_7d: { label: 'Últimos 7 dias' },
  last_14d: { label: 'Últimos 14 dias' },
  last_30d: { label: 'Últimos 30 dias' },
  last_90d: { label: 'Últimos 90 dias' },
  custom: { label: 'Personalizado' },
};

// Global Filter State Interface
export interface GlobalFilters {
  // Primary Filters
  varieties: MangoVariety[];
  productionStages: ProductionStage[];
  criticalityLevels: CriticalityLevel[];
  plots: string[];
  harvestWindow: HarvestWindow;
  dateRangePreset: DateRangePreset;
  dateRange: { from: Date | null; to: Date | null };
  
  // Advanced Agronomic Filters
  treeAgeRange: { min: number | null; max: number | null };
  flowerDensityRange: { min: number | null; max: number | null };
  fruitDensityRange: { min: number | null; max: number | null };
  calibers: FruitCaliber[];
  yieldRange: { min: number | null; max: number | null }; // kg
  moistureRange: { min: number | null; max: number | null };
  phRange: { min: number | null; max: number | null };
  nitrogenRange: { min: number | null; max: number | null };
  phosphorusRange: { min: number | null; max: number | null };
  potassiumRange: { min: number | null; max: number | null };
  
  // Operational Filters
  irrigationStatus: IrrigationStatus[];
  fertilizationStatus: FertilizationStatus[];
  hasRecentEvents: boolean | null; // null = any, true = has, false = none
  recentEventDays: number;
  lastInterventionTypes: string[];
  
  // Geographic Filters
  blocks: string[];
  zones: string[];
  
  // Search
  search: string;
}

// Default Filter State
export const defaultGlobalFilters: GlobalFilters = {
  varieties: [],
  productionStages: [],
  criticalityLevels: [],
  plots: [],
  harvestWindow: 'all',
  dateRangePreset: 'last_30d',
  dateRange: { from: null, to: null },
  
  treeAgeRange: { min: null, max: null },
  flowerDensityRange: { min: null, max: null },
  fruitDensityRange: { min: null, max: null },
  calibers: [],
  yieldRange: { min: null, max: null },
  moistureRange: { min: null, max: null },
  phRange: { min: null, max: null },
  nitrogenRange: { min: null, max: null },
  phosphorusRange: { min: null, max: null },
  potassiumRange: { min: null, max: null },
  
  irrigationStatus: [],
  fertilizationStatus: [],
  hasRecentEvents: null,
  recentEventDays: 7,
  lastInterventionTypes: [],
  
  blocks: [],
  zones: [],
  
  search: '',
};

// Smart Filter Presets
export interface SmartFilter {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  filters: Partial<GlobalFilters>;
  category: 'harvest' | 'quality' | 'intervention' | 'monitoring' | 'custom';
}

export const smartFilters: SmartFilter[] = [
  {
    id: 'harvest_14d',
    name: 'Colheita em 14 dias',
    description: 'Talhões prontos para colheita nos próximos 14 dias',
    icon: 'Calendar',
    color: 'hsl(15, 90%, 50%)',
    filters: { harvestWindow: '14d', productionStages: ['harvest_ready', 'maturation'] },
    category: 'harvest',
  },
  {
    id: 'critical_high_yield',
    name: 'Críticos alto potencial',
    description: 'Talhões críticos com alta produtividade esperada',
    icon: 'AlertTriangle',
    color: 'hsl(var(--status-critical))',
    filters: { criticalityLevels: ['critical', 'emergency'], yieldRange: { min: 5000, max: null } },
    category: 'monitoring',
  },
  {
    id: 'high_flower_low_fruit',
    name: 'Alta floração, baixa frutificação',
    description: 'Talhões com muitas flores mas poucos frutos',
    icon: 'TrendingDown',
    color: 'hsl(var(--status-warning))',
    filters: { 
      flowerDensityRange: { min: 70, max: null }, 
      fruitDensityRange: { min: null, max: 30 },
      productionStages: ['fruit_setting', 'growth']
    },
    category: 'quality',
  },
  {
    id: 'recent_fertilization_no_improvement',
    name: 'Fertilização sem melhoria',
    description: 'Talhões fertilizados recentemente sem melhora visível',
    icon: 'Leaf',
    color: 'hsl(var(--chart-nitrogen))',
    filters: { 
      hasRecentEvents: true, 
      recentEventDays: 14,
      lastInterventionTypes: ['fertilization'],
      criticalityLevels: ['attention', 'critical']
    },
    category: 'intervention',
  },
  {
    id: 'kent_maturation_large',
    name: 'Kent maturação calibre grande',
    description: 'Variedade Kent em maturação com calibre grande',
    icon: 'Target',
    color: 'hsl(35, 80%, 50%)',
    filters: { 
      varieties: ['kent'], 
      productionStages: ['maturation'],
      calibers: ['large', 'extra_large']
    },
    category: 'harvest',
  },
  {
    id: 'irrigation_issues',
    name: 'Problemas de irrigação',
    description: 'Talhões com irrigação abaixo ou acima do ideal',
    icon: 'Droplets',
    color: 'hsl(var(--chart-moisture))',
    filters: { irrigationStatus: ['under', 'excessive'] },
    category: 'monitoring',
  },
  {
    id: 'needs_attention',
    name: 'Requer atenção',
    description: 'Todos os talhões que requerem monitoramento',
    icon: 'Eye',
    color: 'hsl(var(--status-warning))',
    filters: { criticalityLevels: ['attention', 'critical', 'emergency'] },
    category: 'monitoring',
  },
  {
    id: 'tommy_premium',
    name: 'Tommy Atkins Premium',
    description: 'Tommy Atkins com características premium',
    icon: 'Star',
    color: 'hsl(0, 70%, 50%)',
    filters: { 
      varieties: ['tommy_atkins'], 
      calibers: ['large', 'extra_large'],
      criticalityLevels: ['normal']
    },
    category: 'quality',
  },
];

// Saved Filter Preset (user-defined)
export interface SavedFilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: GlobalFilters;
  createdAt: Date;
  createdBy: string;
  isDefault?: boolean;
}

// Helper to count active filters
export function countActiveFilters(filters: GlobalFilters): number {
  let count = 0;
  
  if (filters.varieties.length > 0) count++;
  if (filters.productionStages.length > 0) count++;
  if (filters.criticalityLevels.length > 0) count++;
  if (filters.plots.length > 0) count++;
  if (filters.harvestWindow !== 'all') count++;
  if (filters.calibers.length > 0) count++;
  if (filters.irrigationStatus.length > 0) count++;
  if (filters.fertilizationStatus.length > 0) count++;
  if (filters.hasRecentEvents !== null) count++;
  if (filters.search) count++;
  if (filters.yieldRange.min || filters.yieldRange.max) count++;
  if (filters.moistureRange.min || filters.moistureRange.max) count++;
  if (filters.phRange.min || filters.phRange.max) count++;
  if (filters.treeAgeRange.min || filters.treeAgeRange.max) count++;
  
  return count;
}

// Helper to serialize filters to URL
export function filtersToUrlParams(filters: GlobalFilters): URLSearchParams {
  const params = new URLSearchParams();
  
  if (filters.varieties.length > 0) params.set('varieties', filters.varieties.join(','));
  if (filters.productionStages.length > 0) params.set('stages', filters.productionStages.join(','));
  if (filters.criticalityLevels.length > 0) params.set('criticality', filters.criticalityLevels.join(','));
  if (filters.plots.length > 0) params.set('plots', filters.plots.join(','));
  if (filters.harvestWindow !== 'all') params.set('harvest', filters.harvestWindow);
  if (filters.calibers.length > 0) params.set('calibers', filters.calibers.join(','));
  if (filters.search) params.set('q', filters.search);
  if (filters.yieldRange.min) params.set('yieldMin', filters.yieldRange.min.toString());
  if (filters.yieldRange.max) params.set('yieldMax', filters.yieldRange.max.toString());
  
  return params;
}

// Helper to parse filters from URL
export function urlParamsToFilters(params: URLSearchParams): Partial<GlobalFilters> {
  const filters: Partial<GlobalFilters> = {};
  
  const varieties = params.get('varieties');
  if (varieties) filters.varieties = varieties.split(',') as MangoVariety[];
  
  const stages = params.get('stages');
  if (stages) filters.productionStages = stages.split(',') as ProductionStage[];
  
  const criticality = params.get('criticality');
  if (criticality) filters.criticalityLevels = criticality.split(',') as CriticalityLevel[];
  
  const plots = params.get('plots');
  if (plots) filters.plots = plots.split(',');
  
  const harvest = params.get('harvest');
  if (harvest) filters.harvestWindow = harvest as HarvestWindow;
  
  const calibers = params.get('calibers');
  if (calibers) filters.calibers = calibers.split(',') as FruitCaliber[];
  
  const search = params.get('q');
  if (search) filters.search = search;
  
  const yieldMin = params.get('yieldMin');
  const yieldMax = params.get('yieldMax');
  if (yieldMin || yieldMax) {
    filters.yieldRange = {
      min: yieldMin ? parseInt(yieldMin) : null,
      max: yieldMax ? parseInt(yieldMax) : null,
    };
  }
  
  return filters;
}
