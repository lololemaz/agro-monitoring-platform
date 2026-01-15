// Tree-level data for heatmap visualization

export type HeatmapMetricType = 
  | 'soilMoisture'
  | 'temperature'
  | 'electricalConductivity'
  | 'ph'
  | 'nitrogen'
  | 'potassium'
  | 'phosphorus'
  | 'chlorophyllIndex'
  | 'mangoCount'
  | 'limeApplication';

export interface TreeData {
  id: string;
  plotId: string;
  plotName: string;
  row: number;
  col: number;
  x: number; // Normalized position (0-1)
  y: number; // Normalized position (0-1)
  variety: string;
  lastUpdate: Date;
  metrics: {
    soilMoisture: number;       // 0-100 %
    temperature: number;        // 15-45 °C
    electricalConductivity: number; // 0-5 dS/m
    ph: number;                 // 4-9
    nitrogen: number;           // 0-100 ppm
    potassium: number;          // 0-300 ppm
    phosphorus: number;         // 0-80 ppm
    chlorophyllIndex: number;   // 0-100
    mangoCount: number;         // 0-200
    limeApplication: number;    // 0-100 (% coverage)
  };
  isCritical: boolean;
  isOutlier: boolean;
}

export interface MetricConfig {
  key: HeatmapMetricType;
  label: string;
  unit: string;
  min: number;
  max: number;
  optimalMin: number;
  optimalMax: number;
  colorScale: {
    value: number;
    color: string;
    label: string;
  }[];
  description: string;
}

// Metric configurations with color scales
export const metricConfigs: Record<HeatmapMetricType, MetricConfig> = {
  soilMoisture: {
    key: 'soilMoisture',
    label: 'Umidade do Solo',
    unit: '%',
    min: 0,
    max: 100,
    optimalMin: 18,
    optimalMax: 28,
    colorScale: [
      { value: 0, color: '#FBBF24', label: 'Estresse hídrico' },
      { value: 10, color: '#FB923C', label: 'Muito baixa' },
      { value: 18, color: '#93C5FD', label: 'Moderada' },
      { value: 23, color: '#C4B5FD', label: 'Ótima' },
      { value: 28, color: '#A78BFA', label: 'Alta' },
      { value: 40, color: '#7C3AED', label: 'Saturação' },
    ],
    description: 'Teor de água no solo. Valores ótimos entre 18-28%.',
  },
  temperature: {
    key: 'temperature',
    label: 'Temperatura',
    unit: '°C',
    min: 15,
    max: 45,
    optimalMin: 22,
    optimalMax: 32,
    colorScale: [
      { value: 15, color: '#3B82F6', label: 'Frio' },
      { value: 22, color: '#22C55E', label: 'Ideal baixo' },
      { value: 27, color: '#84CC16', label: 'Ótimo' },
      { value: 32, color: '#F59E0B', label: 'Quente' },
      { value: 40, color: '#EF4444', label: 'Crítico' },
    ],
    description: 'Temperatura do solo/ambiente. Faixa ideal 22-32°C.',
  },
  electricalConductivity: {
    key: 'electricalConductivity',
    label: 'Condutividade Elétrica',
    unit: 'dS/m',
    min: 0,
    max: 5,
    optimalMin: 0.8,
    optimalMax: 2.0,
    colorScale: [
      { value: 0, color: '#FDE68A', label: 'Baixa' },
      { value: 0.8, color: '#84CC16', label: 'Adequada' },
      { value: 1.4, color: '#22C55E', label: 'Ótima' },
      { value: 2.0, color: '#F59E0B', label: 'Elevada' },
      { value: 3.5, color: '#EF4444', label: 'Salinidade' },
    ],
    description: 'Indica salinidade do solo. Ideal entre 0.8-2.0 dS/m.',
  },
  ph: {
    key: 'ph',
    label: 'pH',
    unit: '',
    min: 4,
    max: 9,
    optimalMin: 6.0,
    optimalMax: 7.5,
    colorScale: [
      { value: 4, color: '#EF4444', label: 'Muito ácido' },
      { value: 5.5, color: '#F59E0B', label: 'Ácido' },
      { value: 6.0, color: '#84CC16', label: 'Bom' },
      { value: 6.8, color: '#22C55E', label: 'Ótimo' },
      { value: 7.5, color: '#84CC16', label: 'Bom' },
      { value: 8.5, color: '#EF4444', label: 'Alcalino' },
    ],
    description: 'Acidez do solo. Mangueiras preferem pH 6.0-7.5.',
  },
  nitrogen: {
    key: 'nitrogen',
    label: 'Nitrogênio (N)',
    unit: 'ppm',
    min: 0,
    max: 100,
    optimalMin: 20,
    optimalMax: 50,
    colorScale: [
      { value: 0, color: '#FDE68A', label: 'Deficiente' },
      { value: 15, color: '#FBBF24', label: 'Baixo' },
      { value: 20, color: '#84CC16', label: 'Adequado' },
      { value: 35, color: '#22C55E', label: 'Ótimo' },
      { value: 50, color: '#10B981', label: 'Alto' },
      { value: 70, color: '#7C3AED', label: 'Excesso' },
    ],
    description: 'Nutriente essencial para crescimento vegetativo.',
  },
  potassium: {
    key: 'potassium',
    label: 'Potássio (K)',
    unit: 'ppm',
    min: 0,
    max: 300,
    optimalMin: 100,
    optimalMax: 200,
    colorScale: [
      { value: 0, color: '#FDE68A', label: 'Deficiente' },
      { value: 80, color: '#FBBF24', label: 'Baixo' },
      { value: 100, color: '#84CC16', label: 'Adequado' },
      { value: 150, color: '#22C55E', label: 'Ótimo' },
      { value: 200, color: '#10B981', label: 'Alto' },
      { value: 260, color: '#7C3AED', label: 'Excesso' },
    ],
    description: 'Crucial para qualidade dos frutos e resistência.',
  },
  phosphorus: {
    key: 'phosphorus',
    label: 'Fósforo (P)',
    unit: 'ppm',
    min: 0,
    max: 80,
    optimalMin: 15,
    optimalMax: 40,
    colorScale: [
      { value: 0, color: '#FDE68A', label: 'Deficiente' },
      { value: 10, color: '#FBBF24', label: 'Baixo' },
      { value: 15, color: '#84CC16', label: 'Adequado' },
      { value: 27, color: '#22C55E', label: 'Ótimo' },
      { value: 40, color: '#10B981', label: 'Alto' },
      { value: 60, color: '#7C3AED', label: 'Excesso' },
    ],
    description: 'Importante para raízes e floração.',
  },
  chlorophyllIndex: {
    key: 'chlorophyllIndex',
    label: 'Índice de Clorofila',
    unit: '',
    min: 0,
    max: 100,
    optimalMin: 60,
    optimalMax: 100,
    colorScale: [
      { value: 0, color: '#FDE68A', label: 'Deficiente' },
      { value: 30, color: '#FBBF24', label: 'Baixo' },
      { value: 50, color: '#84CC16', label: 'Moderado' },
      { value: 70, color: '#22C55E', label: 'Bom' },
      { value: 85, color: '#10B981', label: 'Excelente' },
    ],
    description: 'Indica saúde fotossintética da planta.',
  },
  mangoCount: {
    key: 'mangoCount',
    label: 'Contagem de Mangas',
    unit: 'frutos',
    min: 0,
    max: 200,
    optimalMin: 50,
    optimalMax: 150,
    colorScale: [
      { value: 0, color: '#FDE68A', label: 'Baixa' },
      { value: 30, color: '#FBBF24', label: 'Pouca' },
      { value: 50, color: '#84CC16', label: 'Moderada' },
      { value: 80, color: '#22C55E', label: 'Boa' },
      { value: 120, color: '#10B981', label: 'Alta' },
      { value: 160, color: '#059669', label: 'Excelente' },
    ],
    description: 'Quantidade de frutos por árvore.',
  },
  limeApplication: {
    key: 'limeApplication',
    label: 'Cal (Proteção Solar)',
    unit: '%',
    min: 0,
    max: 100,
    optimalMin: 70,
    optimalMax: 100,
    colorScale: [
      { value: 0, color: '#EF4444', label: 'Sem proteção' },
      { value: 30, color: '#F59E0B', label: 'Parcial' },
      { value: 50, color: '#FBBF24', label: 'Moderada' },
      { value: 70, color: '#84CC16', label: 'Boa' },
      { value: 90, color: '#22C55E', label: 'Excelente' },
    ],
    description: 'Cobertura de cal para proteção solar das árvores.',
  },
};

// Get color for a metric value
export function getColorForValue(metric: HeatmapMetricType, value: number): string {
  const config = metricConfigs[metric];
  const scale = config.colorScale;
  
  // Clamp value to min/max
  const clampedValue = Math.max(config.min, Math.min(config.max, value));
  
  // Find the two points to interpolate between
  let lowerIdx = 0;
  for (let i = 0; i < scale.length - 1; i++) {
    if (clampedValue >= scale[i].value) {
      lowerIdx = i;
    }
  }
  
  const upperIdx = Math.min(lowerIdx + 1, scale.length - 1);
  
  if (lowerIdx === upperIdx) {
    return scale[lowerIdx].color;
  }
  
  // Calculate interpolation factor
  const range = scale[upperIdx].value - scale[lowerIdx].value;
  const factor = range > 0 ? (clampedValue - scale[lowerIdx].value) / range : 0;
  
  // Interpolate colors
  return interpolateColor(scale[lowerIdx].color, scale[upperIdx].color, factor);
}

// Helper function to interpolate between two hex colors
function interpolateColor(color1: string, color2: string, factor: number): string {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  
  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);
  
  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Check if value is in optimal range
export function isInOptimalRange(metric: HeatmapMetricType, value: number): boolean {
  const config = metricConfigs[metric];
  return value >= config.optimalMin && value <= config.optimalMax;
}

// Check if value is critical (outside warning thresholds)
export function isCriticalValue(metric: HeatmapMetricType, value: number): boolean {
  const config = metricConfigs[metric];
  const range = config.max - config.min;
  const threshold = range * 0.15;
  return value < config.min + threshold || value > config.max - threshold;
}

// Generate mock tree data for a plot
function generateTreesForPlot(
  plotId: string,
  plotName: string,
  variety: string,
  rows: number,
  cols: number,
  baseX: number,
  baseY: number,
  plotWidth: number,
  plotHeight: number,
  baseHealth: 'good' | 'moderate' | 'poor'
): TreeData[] {
  const trees: TreeData[] = [];
  const now = new Date();
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const treeId = `${plotId}-T${row.toString().padStart(2, '0')}${col.toString().padStart(2, '0')}`;
      
      // Add some natural variation and clustering
      const clusterFactor = Math.sin(row * 0.5) * Math.cos(col * 0.5) * 0.3 + 1;
      const randomVariance = () => (Math.random() - 0.5) * 0.2;
      
      // Base metrics depend on health status
      const healthMultiplier = baseHealth === 'good' ? 1 : baseHealth === 'moderate' ? 0.8 : 0.6;
      
      // Create clustered/spatial patterns
      const spatialNoise = Math.sin((row + col) * 0.3) * 0.2 + Math.random() * 0.15;
      
      const metrics = {
        soilMoisture: Math.max(5, Math.min(50, 23 * healthMultiplier * clusterFactor + randomVariance() * 15 + spatialNoise * 10)),
        temperature: Math.max(18, Math.min(42, 27 + randomVariance() * 8 + spatialNoise * 5)),
        electricalConductivity: Math.max(0.3, Math.min(4, 1.4 * clusterFactor + randomVariance() * 0.8)),
        ph: Math.max(5, Math.min(8.5, 6.8 + randomVariance() * 1.2)),
        nitrogen: Math.max(5, Math.min(80, 35 * healthMultiplier + randomVariance() * 20 + spatialNoise * 15)),
        potassium: Math.max(50, Math.min(280, 150 * healthMultiplier + randomVariance() * 60)),
        phosphorus: Math.max(5, Math.min(65, 27 * healthMultiplier + randomVariance() * 15)),
        chlorophyllIndex: Math.max(20, Math.min(95, 75 * healthMultiplier * clusterFactor + randomVariance() * 20)),
        mangoCount: Math.max(0, Math.min(180, Math.round(80 * healthMultiplier * clusterFactor + randomVariance() * 50))),
        limeApplication: Math.max(0, Math.min(100, 70 * healthMultiplier + randomVariance() * 40)),
      };
      
      const isCritical = Object.entries(metrics).some(([key, value]) => 
        isCriticalValue(key as HeatmapMetricType, value)
      );
      
      const isOutlier = Math.random() < 0.02; // 2% chance of being an outlier
      
      trees.push({
        id: treeId,
        plotId,
        plotName,
        row,
        col,
        x: baseX + (col / cols) * plotWidth + (Math.random() - 0.5) * 0.005,
        y: baseY + (row / rows) * plotHeight + (Math.random() - 0.5) * 0.005,
        variety,
        lastUpdate: new Date(now.getTime() - Math.random() * 3600000), // Last hour
        metrics,
        isCritical,
        isOutlier,
      });
    }
  }
  
  return trees;
}

// Generate all trees for the farm
export function generateFarmTrees(): TreeData[] {
  const allTrees: TreeData[] = [];
  
  // Plot configurations with spatial layout
  const plotConfigs: {
    id: string;
    name: string;
    variety: string;
    rows: number;
    cols: number;
    baseX: number;
    baseY: number;
    width: number;
    height: number;
    health: 'good' | 'moderate' | 'poor';
  }[] = [
    // Row 1 - Top plots
    { id: 'T01', name: 'Talhão 01', variety: 'Tommy Atkins', rows: 15, cols: 25, baseX: 0.02, baseY: 0.02, width: 0.22, height: 0.20, health: 'good' },
    { id: 'T02', name: 'Talhão 02', variety: 'Kent', rows: 15, cols: 20, baseX: 0.26, baseY: 0.02, width: 0.18, height: 0.20, health: 'good' },
    { id: 'T03', name: 'Talhão 03', variety: 'Palmer', rows: 12, cols: 18, baseX: 0.46, baseY: 0.02, width: 0.16, height: 0.18, health: 'moderate' },
    { id: 'T04', name: 'Talhão 04', variety: 'Keitt', rows: 14, cols: 22, baseX: 0.64, baseY: 0.02, width: 0.20, height: 0.19, health: 'good' },
    { id: 'T05', name: 'Talhão 05', variety: 'Tommy Atkins', rows: 10, cols: 15, baseX: 0.86, baseY: 0.02, width: 0.12, height: 0.15, health: 'poor' },
    
    // Row 2 - Middle-top plots
    { id: 'T06', name: 'Talhão 06', variety: 'Kent', rows: 18, cols: 22, baseX: 0.02, baseY: 0.25, width: 0.20, height: 0.22, health: 'good' },
    { id: 'T07', name: 'Talhão 07', variety: 'Tommy Atkins', rows: 16, cols: 28, baseX: 0.24, baseY: 0.25, width: 0.26, height: 0.20, health: 'moderate' },
    { id: 'T08', name: 'Talhão 08', variety: 'Palmer', rows: 14, cols: 20, baseX: 0.52, baseY: 0.24, width: 0.18, height: 0.18, health: 'good' },
    { id: 'T09', name: 'Talhão 09', variety: 'Keitt', rows: 15, cols: 18, baseX: 0.72, baseY: 0.24, width: 0.16, height: 0.19, health: 'moderate' },
    
    // Row 3 - Middle plots
    { id: 'T10', name: 'Talhão 10', variety: 'Tommy Atkins', rows: 20, cols: 30, baseX: 0.02, baseY: 0.50, width: 0.28, height: 0.24, health: 'good' },
    { id: 'T11', name: 'Talhão 11', variety: 'Kent', rows: 18, cols: 25, baseX: 0.32, baseY: 0.48, width: 0.24, height: 0.22, health: 'poor' },
    { id: 'T12', name: 'Talhão 12', variety: 'Palmer', rows: 16, cols: 22, baseX: 0.58, baseY: 0.48, width: 0.20, height: 0.20, health: 'good' },
    { id: 'T13', name: 'Talhão 13', variety: 'Tommy Atkins', rows: 14, cols: 16, baseX: 0.80, baseY: 0.46, width: 0.14, height: 0.18, health: 'moderate' },
    
    // Row 4 - Bottom plots  
    { id: 'T14', name: 'Talhão 14', variety: 'Keitt', rows: 15, cols: 20, baseX: 0.02, baseY: 0.76, width: 0.18, height: 0.20, health: 'good' },
    { id: 'T15', name: 'Talhão 15', variety: 'Kent', rows: 12, cols: 24, baseX: 0.22, baseY: 0.76, width: 0.22, height: 0.18, health: 'good' },
    { id: 'T16', name: 'Talhão 16', variety: 'Tommy Atkins', rows: 18, cols: 26, baseX: 0.46, baseY: 0.74, width: 0.24, height: 0.22, health: 'moderate' },
    { id: 'T17', name: 'Talhão 17', variety: 'Palmer', rows: 14, cols: 18, baseX: 0.72, baseY: 0.74, width: 0.16, height: 0.18, health: 'good' },
  ];
  
  for (const config of plotConfigs) {
    const trees = generateTreesForPlot(
      config.id,
      config.name,
      config.variety,
      config.rows,
      config.cols,
      config.baseX,
      config.baseY,
      config.width,
      config.height,
      config.health
    );
    allTrees.push(...trees);
  }
  
  return allTrees;
}

// Export singleton of farm trees
export const farmTrees = generateFarmTrees();

// Get unique plots from trees
export function getUniquePlots(trees: TreeData[]): { id: string; name: string }[] {
  const seen = new Set<string>();
  return trees
    .filter(t => {
      if (seen.has(t.plotId)) return false;
      seen.add(t.plotId);
      return true;
    })
    .map(t => ({ id: t.plotId, name: t.plotName }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

// Get tree statistics
export function getTreeStats(trees: TreeData[], metric: HeatmapMetricType) {
  const values = trees.map(t => t.metrics[metric]);
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const criticalCount = trees.filter(t => isCriticalValue(metric, t.metrics[metric])).length;
  const optimalCount = trees.filter(t => isInOptimalRange(metric, t.metrics[metric])).length;
  
  return { avg, min, max, criticalCount, optimalCount, total: trees.length };
}
