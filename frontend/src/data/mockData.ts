// Types
export type Status = 'ok' | 'warning' | 'critical' | 'offline';
export type AlertCategory = 'irrigation' | 'soil' | 'pests' | 'health' | 'production' | 'system';
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type UserRole = 'owner' | 'executive' | 'agronomist' | 'operator';

// Soil Sensor Reading
export interface SoilReading {
  timestamp: Date;
  moisture: number;
  temperature: number;
  ec: number;
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
}

// Computer Vision Data
export interface VisionData {
  timestamp: Date;
  // Thermal Camera
  irrigationFailures: number;
  waterStressLevel: number; // 0-100
  overIrrigationDetected: boolean;
  blockedLines: number;
  // RGB Camera
  fruitCount: number;
  avgFruitSize: number; // mm
  floweringPercentage: number;
  pestsDetected: boolean;
  pestType?: string;
  fallenFruits: number;
  // Multispectral NIR
  chlorophyllLevel: number; // 0-100
  ndvi: number; // -1 to 1
  vegetativeStress: number; // 0-100
  maturityIndex: number; // 0-100
}

// Tree entity with historical memory
export interface Tree {
  id: string;
  rowId: string;
  plotId: string;
  plantingDate: Date;
  variety: string;
  healthScore: number;
  fruitCount: number;
  lastInspection: Date;
}

// Row within a plot
export interface Row {
  id: string;
  plotId: string;
  treeCount: number;
  avgHealth: number;
  irrigationStatus: Status;
}

// Sensor device
export interface Sensor {
  id: string;
  plotId: string;
  type: 'soil' | 'weather' | 'camera';
  lastSignal: Date;
  batteryLevel: number;
  isOnline: boolean;
  signalStrength: number; // 0-100
}

// Plot (field) with complete data
export interface Plot {
  id: string;
  name: string;
  area: number;
  cropType: string;
  plantingDate: Date;
  season: string;
  currentSoilReading: SoilReading;
  currentVisionData: VisionData;
  status: Status;
  healthScore: number;
  sensors: Sensor[];
  rowCount: number;
  treeCount: number;
  estimatedYield: number; // kg
  coordinates?: { lat: number; lng: number };
}

// Enhanced Alert with actionable information
export interface Alert {
  id: string;
  plotId: string;
  plotName: string;
  rowId?: string;
  treeId?: string;
  category: AlertCategory;
  severity: AlertSeverity;
  type: string;
  title: string;
  message: string;
  impact: string;
  suggestedAction: string;
  timestamp: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  recurrenceCount: number;
}

// Farm with comprehensive structure
export interface Farm {
  id: string;
  name: string;
  company: string;
  totalArea: number;
  activePlots: number;
  plots: Plot[];
  alerts: Alert[];
  healthScore: number;
  estimatedYield: number;
  yieldUnit: string;
}

// User Notes
export interface Note {
  id: string;
  plotId: string;
  userId: string;
  text: string;
  timestamp: Date;
  category?: string;
}

// Dashboard Statistics
export interface FarmStats {
  totalPlots: number;
  okCount: number;
  warningCount: number;
  criticalCount: number;
  offlineCount: number;
  avgMoisture: number;
  avgTemperature: number;
  avgEc: number;
  avgPh: number;
  avgHealthScore: number;
  totalFruitCount: number;
  estimatedYield: number;
  activeAlerts: number;
  irrigationIssues: number;
  pestDetections: number;
}

// Thresholds for status calculation
export const thresholds = {
  moisture: { okMin: 18, okMax: 28, warningMin: 14, warningMax: 32 },
  temperature: { okMin: 18, okMax: 32, warningMin: 15, warningMax: 38 },
  ec: { okMin: 0.8, okMax: 2.0, warningMin: 0.5, warningMax: 2.5 },
  ph: { okMin: 6.0, okMax: 7.5, warningMin: 5.5, warningMax: 8.0 },
  nitrogen: { okMin: 20, okMax: 50, warningMin: 15, warningMax: 60 },
  phosphorus: { okMin: 15, okMax: 40, warningMin: 10, warningMax: 50 },
  potassium: { okMin: 100, okMax: 200, warningMin: 80, warningMax: 250 },
  healthScore: { okMin: 70, okMax: 100, warningMin: 50, warningMax: 70 },
  chlorophyll: { okMin: 60, okMax: 100, warningMin: 40, warningMax: 60 },
  ndvi: { okMin: 0.6, okMax: 1.0, warningMin: 0.4, warningMax: 0.6 },
};

// Helper to calculate status for a metric
function getMetricStatus(value: number, metric: keyof typeof thresholds): Status {
  const t = thresholds[metric];
  
  if (metric === 'temperature' || metric === 'ec') {
    if (value >= t.okMin && value <= t.okMax) return 'ok';
    if (value >= t.warningMin && value <= t.warningMax) return 'warning';
    return 'critical';
  }
  
  if (value >= t.okMin && value <= t.okMax) return 'ok';
  if (value >= t.warningMin && value <= t.warningMax) return 'warning';
  return 'critical';
}

// Calculate overall status from all metrics
function getOverallStatus(soilReading: SoilReading, visionData: VisionData, isOnline: boolean): Status {
  if (!isOnline) return 'offline';
  
  const statuses: Status[] = [
    getMetricStatus(soilReading.moisture, 'moisture'),
    getMetricStatus(soilReading.temperature, 'temperature'),
    getMetricStatus(soilReading.ec, 'ec'),
    getMetricStatus(soilReading.ph, 'ph'),
    getMetricStatus(visionData.chlorophyllLevel, 'chlorophyll'),
    getMetricStatus(visionData.ndvi, 'ndvi'),
  ];
  
  // Add critical conditions
  if (visionData.pestsDetected) statuses.push('warning');
  if (visionData.irrigationFailures > 0) statuses.push('warning');
  if (visionData.waterStressLevel > 70) statuses.push('critical');
  if (visionData.overIrrigationDetected) statuses.push('warning');
  
  if (statuses.includes('critical')) return 'critical';
  if (statuses.includes('warning')) return 'warning';
  return 'ok';
}

// Calculate health score (0-100)
function calculateHealthScore(soilReading: SoilReading, visionData: VisionData): number {
  let score = 100;
  
  // Soil factors (40% weight)
  const moistureScore = getMetricStatus(soilReading.moisture, 'moisture') === 'ok' ? 10 : 
                        getMetricStatus(soilReading.moisture, 'moisture') === 'warning' ? 5 : 0;
  const phScore = getMetricStatus(soilReading.ph, 'ph') === 'ok' ? 10 : 
                  getMetricStatus(soilReading.ph, 'ph') === 'warning' ? 5 : 0;
  const ecScore = getMetricStatus(soilReading.ec, 'ec') === 'ok' ? 10 : 
                  getMetricStatus(soilReading.ec, 'ec') === 'warning' ? 5 : 0;
  const tempScore = getMetricStatus(soilReading.temperature, 'temperature') === 'ok' ? 10 : 
                    getMetricStatus(soilReading.temperature, 'temperature') === 'warning' ? 5 : 0;
  
  // Vision factors (60% weight)
  const ndviScore = Math.min(visionData.ndvi * 30, 30);
  const chlorophyllScore = (visionData.chlorophyllLevel / 100) * 20;
  const stressDeduction = (visionData.vegetativeStress / 100) * 10;
  
  score = moistureScore + phScore + ecScore + tempScore + ndviScore + chlorophyllScore - stressDeduction;
  
  if (visionData.pestsDetected) score -= 15;
  if (visionData.irrigationFailures > 0) score -= 10;
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

// Generate random soil reading
function generateSoilReading(baseValues: Partial<SoilReading>, variance: number = 0.1): SoilReading {
  const randomize = (base: number) => base * (1 + (Math.random() - 0.5) * variance * 2);
  
  return {
    timestamp: new Date(),
    moisture: randomize(baseValues.moisture ?? 23),
    temperature: randomize(baseValues.temperature ?? 26),
    ec: randomize(baseValues.ec ?? 1.5),
    ph: randomize(baseValues.ph ?? 6.8),
    nitrogen: randomize(baseValues.nitrogen ?? 35),
    phosphorus: randomize(baseValues.phosphorus ?? 25),
    potassium: randomize(baseValues.potassium ?? 150),
  };
}

// Generate vision data
function generateVisionData(isHealthy: boolean, variance: number = 0.15): VisionData {
  const healthyBase = {
    irrigationFailures: 0,
    waterStressLevel: 15 + Math.random() * 20,
    overIrrigationDetected: false,
    blockedLines: 0,
    fruitCount: 2500 + Math.random() * 1000,
    avgFruitSize: 75 + Math.random() * 20,
    floweringPercentage: 85 + Math.random() * 15,
    pestsDetected: false,
    fallenFruits: Math.floor(Math.random() * 20),
    chlorophyllLevel: 70 + Math.random() * 25,
    ndvi: 0.7 + Math.random() * 0.25,
    vegetativeStress: 10 + Math.random() * 20,
    maturityIndex: 40 + Math.random() * 30,
  };
  
  const unhealthyBase = {
    irrigationFailures: Math.floor(Math.random() * 3) + 1,
    waterStressLevel: 50 + Math.random() * 40,
    overIrrigationDetected: Math.random() > 0.6,
    blockedLines: Math.floor(Math.random() * 5),
    fruitCount: 1500 + Math.random() * 800,
    avgFruitSize: 55 + Math.random() * 20,
    floweringPercentage: 50 + Math.random() * 30,
    pestsDetected: Math.random() > 0.5,
    pestType: Math.random() > 0.5 ? 'Mosca-da-fruta' : 'Antracnose',
    fallenFruits: Math.floor(50 + Math.random() * 100),
    chlorophyllLevel: 35 + Math.random() * 25,
    ndvi: 0.35 + Math.random() * 0.2,
    vegetativeStress: 50 + Math.random() * 40,
    maturityIndex: 20 + Math.random() * 40,
  };
  
  const base = isHealthy ? healthyBase : unhealthyBase;
  
  return {
    timestamp: new Date(),
    ...base,
  };
}

// Generate time series data
export function generateTimeSeries(hours: number, baseReading: SoilReading): SoilReading[] {
  const readings: SoilReading[] = [];
  const now = new Date();
  
  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    const reading = generateSoilReading(baseReading, 0.15);
    reading.timestamp = timestamp;
    readings.push(reading);
  }
  
  return readings;
}

// Alert message generators - Portuguese
function generateAlertDetails(category: AlertCategory, type: string, value: number): { title: string; message: string; impact: string; suggestedAction: string } {
  const alerts: Record<string, { title: string; message: string; impact: string; suggestedAction: string }> = {
    'irrigation_failure': {
      title: 'Falha no Sistema de Irrigação',
      message: `${value} linhas de irrigação detectadas com falhas ou bloqueios.`,
      impact: 'Risco de estresse hídrico e redução na qualidade dos frutos nas áreas afetadas.',
      suggestedAction: 'Enviar equipe de campo para inspecionar e reparar as linhas de irrigação do setor.',
    },
    'water_stress': {
      title: 'Estresse Hídrico Detectado',
      message: `Nível de estresse hídrico em ${value.toFixed(0)}%, excedendo o limite ideal.`,
      impact: 'Potencial redução de 15-25% na produção se não tratado em 48 horas.',
      suggestedAction: 'Aumentar frequência de irrigação e verificar sensores de umidade do solo.',
    },
    'over_irrigation': {
      title: 'Alerta de Excesso de Irrigação',
      message: 'Excesso de água detectado, saturação do solo acima dos níveis ideais.',
      impact: 'Risco de apodrecimento de raízes, lixiviação de nutrientes e doenças fúngicas.',
      suggestedAction: 'Reduzir irrigação em 30% e monitorar condições de drenagem.',
    },
    'pest_detection': {
      title: 'Atividade de Pragas Detectada',
      message: `Presença de ${type} confirmada pelo sistema de inspeção visual.`,
      impact: 'Potencial estimado de 10-20% de perda da safra se não tratado.',
      suggestedAction: 'Agendar aplicação direcionada de pesticida em 24 horas.',
    },
    'low_chlorophyll': {
      title: 'Níveis Baixos de Clorofila',
      message: `Índice de clorofila em ${value.toFixed(0)}%, indicando deficiência nutricional.`,
      impact: 'Eficiência reduzida de fotossíntese afetando o desenvolvimento dos frutos.',
      suggestedAction: 'Aplicar fertilizante foliar e analisar níveis de nutrientes do solo.',
    },
    'fallen_fruits': {
      title: 'Alta Taxa de Queda de Frutos',
      message: `${value} frutos caídos detectados, excedendo o limite normal.`,
      impact: 'Perda financeira direta e potencial foco de reprodução de pragas.',
      suggestedAction: 'Investigar causa (pragas, doenças ou estresse ambiental).',
    },
    'temperature_critical': {
      title: 'Temperatura Crítica',
      message: `Temperatura do solo em ${value.toFixed(1)}°C, fora da faixa segura.`,
      impact: 'Estresse radicular e absorção reduzida de nutrientes.',
      suggestedAction: 'Implementar sombreamento ou cobertura morta para regular temperatura.',
    },
    'sensor_offline': {
      title: 'Comunicação do Sensor Perdida',
      message: 'Sensor de solo não reporta dados há mais de 2 horas.',
      impact: 'Ponto cego na cobertura de monitoramento.',
      suggestedAction: 'Verificar bateria e conectividade do sensor. Substituir se necessário.',
    },
    'moisture_critical': {
      title: 'Nível Crítico de Umidade',
      message: `Umidade do solo em ${value.toFixed(1)}%, ${value < 14 ? 'perigosamente baixa' : 'excessivamente alta'}.`,
      impact: 'Risco imediato para saúde das plantas e qualidade dos frutos.',
      suggestedAction: value < 14 ? 'Irrigação emergencial necessária.' : 'Interromper irrigação e melhorar drenagem.',
    },
    'ph_imbalance': {
      title: 'Desequilíbrio de pH Detectado',
      message: `pH do solo em ${value.toFixed(1)}, fora da faixa ideal para cultivo de manga.`,
      impact: 'Disponibilidade reduzida de nutrientes afetando saúde das árvores.',
      suggestedAction: value < 6 ? 'Aplicar calcário para elevar o pH.' : 'Aplicar enxofre para reduzir o pH.',
    },
  };
  
  return alerts[type] || {
    title: 'Alerta do Sistema',
    message: 'Uma anomalia foi detectada.',
    impact: 'Requer investigação.',
    suggestedAction: 'Revisar dados dos sensores e condições do campo.',
  };
}

// Generate mock farm data
function generateMockFarm(): Farm {
  const plots: Plot[] = [];
  const alerts: Alert[] = [];
  
  // Plot configurations
  const plotConfigs = [
    // Normal plots (35)
    ...Array(35).fill(null).map(() => ({
      isHealthy: true,
      isOnline: true,
      moisture: 20 + Math.random() * 8,
      temperature: 24 + Math.random() * 6,
      ec: 1.0 + Math.random() * 0.8,
      ph: 6.2 + Math.random() * 1.0,
      nitrogen: 25 + Math.random() * 20,
      phosphorus: 18 + Math.random() * 18,
      potassium: 120 + Math.random() * 60,
    })),
    // Warning plots (8)
    ...Array(8).fill(null).map(() => ({
      isHealthy: false,
      isOnline: true,
      moisture: Math.random() > 0.5 ? 15 + Math.random() * 3 : 29 + Math.random() * 3,
      temperature: 33 + Math.random() * 3,
      ec: 2.1 + Math.random() * 0.3,
      ph: Math.random() > 0.5 ? 5.5 + Math.random() * 0.3 : 7.6 + Math.random() * 0.3,
      nitrogen: Math.random() > 0.5 ? 16 + Math.random() * 4 : 51 + Math.random() * 8,
      phosphorus: Math.random() > 0.5 ? 11 + Math.random() * 4 : 41 + Math.random() * 8,
      potassium: Math.random() > 0.5 ? 81 + Math.random() * 19 : 201 + Math.random() * 48,
    })),
    // Critical plots (4)
    ...Array(4).fill(null).map(() => ({
      isHealthy: false,
      isOnline: true,
      moisture: Math.random() > 0.5 ? 8 + Math.random() * 5 : 34 + Math.random() * 4,
      temperature: 38 + Math.random() * 3,
      ec: 2.6 + Math.random() * 0.4,
      ph: Math.random() > 0.5 ? 5.0 + Math.random() * 0.4 : 8.1 + Math.random() * 0.4,
      nitrogen: Math.random() > 0.5 ? 5 + Math.random() * 9 : 62 + Math.random() * 10,
      phosphorus: Math.random() > 0.5 ? 3 + Math.random() * 6 : 52 + Math.random() * 10,
      potassium: Math.random() > 0.5 ? 50 + Math.random() * 29 : 252 + Math.random() * 50,
    })),
    // Offline plots (3)
    ...Array(3).fill(null).map(() => ({
      isHealthy: true,
      isOnline: false,
      moisture: 22,
      temperature: 27,
      ec: 1.5,
      ph: 6.8,
      nitrogen: 35,
      phosphorus: 25,
      potassium: 150,
    })),
  ];
  
  // Shuffle configs
  const shuffled = plotConfigs.sort(() => Math.random() - 0.5);
  
  for (let i = 1; i <= 50; i++) {
    const config = shuffled[i - 1];
    const plotId = `T${i.toString().padStart(2, '0')}`;
    const now = new Date();
    
    const sensors: Sensor[] = [
      {
        id: `S${i.toString().padStart(3, '0')}-SOIL`,
        plotId,
        type: 'soil',
        lastSignal: config.isOnline 
          ? new Date(now.getTime() - Math.random() * 30 * 60 * 1000)
          : new Date(now.getTime() - (3 + Math.random() * 5) * 60 * 60 * 1000),
        batteryLevel: config.isOnline ? 50 + Math.random() * 50 : 10 + Math.random() * 20,
        isOnline: config.isOnline,
        signalStrength: config.isOnline ? 60 + Math.random() * 40 : 0,
      },
    ];
    
    const currentSoilReading = generateSoilReading({
      moisture: config.moisture,
      temperature: config.temperature,
      ec: config.ec,
      ph: config.ph,
      nitrogen: config.nitrogen,
      phosphorus: config.phosphorus,
      potassium: config.potassium,
    }, 0.05);
    currentSoilReading.timestamp = sensors[0].lastSignal;
    
    const currentVisionData = generateVisionData(config.isHealthy);
    currentVisionData.timestamp = new Date(now.getTime() - Math.random() * 2 * 60 * 60 * 1000);
    
    const status = getOverallStatus(currentSoilReading, currentVisionData, config.isOnline);
    const healthScore = calculateHealthScore(currentSoilReading, currentVisionData);
    
    const plot: Plot = {
      id: plotId,
      name: plotId,
      area: 4,
      cropType: 'Manga - Tommy Atkins',
      plantingDate: new Date('2020-03-15'),
      season: 'Safra 2024/2025',
      currentSoilReading,
      currentVisionData,
      status,
      healthScore,
      sensors,
      rowCount: 20,
      treeCount: 400,
      estimatedYield: config.isHealthy ? 12000 + Math.random() * 4000 : 6000 + Math.random() * 4000,
    };
    
    plots.push(plot);
    
    // Generate alerts
    if (status === 'warning' || status === 'critical') {
      // Soil-based alerts
      if (getMetricStatus(currentSoilReading.moisture, 'moisture') !== 'ok') {
        const details = generateAlertDetails('soil', 'moisture_critical', currentSoilReading.moisture);
        alerts.push({
          id: `${plotId}-moisture-${Date.now()}`,
          plotId,
          plotName: plotId,
          category: 'soil',
          severity: getMetricStatus(currentSoilReading.moisture, 'moisture') === 'critical' ? 'critical' : 'warning',
          type: 'moisture_critical',
          ...details,
          timestamp: new Date(now.getTime() - Math.random() * 2 * 60 * 60 * 1000),
          recurrenceCount: Math.floor(Math.random() * 3) + 1,
        });
      }
      
      // Vision-based alerts
      if (currentVisionData.irrigationFailures > 0) {
        const details = generateAlertDetails('irrigation', 'irrigation_failure', currentVisionData.irrigationFailures);
        alerts.push({
          id: `${plotId}-irrigation-${Date.now()}`,
          plotId,
          plotName: plotId,
          category: 'irrigation',
          severity: 'critical',
          type: 'irrigation_failure',
          ...details,
          timestamp: new Date(now.getTime() - Math.random() * 4 * 60 * 60 * 1000),
          recurrenceCount: Math.floor(Math.random() * 5) + 1,
        });
      }
      
      if (currentVisionData.pestsDetected) {
        const details = generateAlertDetails('pests', 'pest_detection', 0);
        alerts.push({
          id: `${plotId}-pest-${Date.now()}`,
          plotId,
          plotName: plotId,
          category: 'pests',
          severity: 'warning',
          type: 'pest_detection',
          title: details.title,
          message: `${currentVisionData.pestType} presence confirmed by visual inspection system.`,
          impact: details.impact,
          suggestedAction: details.suggestedAction,
          timestamp: new Date(now.getTime() - Math.random() * 6 * 60 * 60 * 1000),
          recurrenceCount: Math.floor(Math.random() * 2) + 1,
        });
      }
      
      if (currentVisionData.waterStressLevel > 60) {
        const details = generateAlertDetails('irrigation', 'water_stress', currentVisionData.waterStressLevel);
        alerts.push({
          id: `${plotId}-stress-${Date.now()}`,
          plotId,
          plotName: plotId,
          category: 'irrigation',
          severity: currentVisionData.waterStressLevel > 80 ? 'critical' : 'warning',
          type: 'water_stress',
          ...details,
          timestamp: new Date(now.getTime() - Math.random() * 3 * 60 * 60 * 1000),
          recurrenceCount: Math.floor(Math.random() * 4) + 1,
        });
      }
      
      if (currentVisionData.fallenFruits > 50) {
        const details = generateAlertDetails('production', 'fallen_fruits', currentVisionData.fallenFruits);
        alerts.push({
          id: `${plotId}-fallen-${Date.now()}`,
          plotId,
          plotName: plotId,
          category: 'production',
          severity: currentVisionData.fallenFruits > 100 ? 'critical' : 'warning',
          type: 'fallen_fruits',
          ...details,
          timestamp: new Date(now.getTime() - Math.random() * 8 * 60 * 60 * 1000),
          recurrenceCount: Math.floor(Math.random() * 3) + 1,
        });
      }
    }
    
    if (!config.isOnline) {
      const details = generateAlertDetails('system', 'sensor_offline', 0);
      alerts.push({
        id: `${plotId}-offline-${Date.now()}`,
        plotId,
        plotName: plotId,
        category: 'system',
        severity: 'critical',
        type: 'sensor_offline',
        ...details,
        timestamp: sensors[0].lastSignal,
        recurrenceCount: 1,
      });
    }
  }
  
  const totalYield = plots.reduce((sum, p) => sum + p.estimatedYield, 0);
  const avgHealth = plots.reduce((sum, p) => sum + p.healthScore, 0) / plots.length;
  
  return {
    id: 'farm-001',
    name: 'Fazenda Santa Helena',
    company: 'Kernova AgOS',
    totalArea: 200,
    activePlots: 50,
    plots: plots.sort((a, b) => a.id.localeCompare(b.id)),
    alerts: alerts.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return b.timestamp.getTime() - a.timestamp.getTime();
    }),
    healthScore: Math.round(avgHealth),
    estimatedYield: Math.round(totalYield),
    yieldUnit: 'kg',
  };
}

// Export mock data
export const mockFarm = generateMockFarm();

// Generate time series for a specific plot
export function getPlotTimeSeries(plotId: string, hours: number): SoilReading[] {
  const plot = mockFarm.plots.find(p => p.id === plotId);
  if (!plot) return [];
  return generateTimeSeries(hours, plot.currentSoilReading);
}

// Calculate farm statistics
export function getFarmStats(): FarmStats {
  const onlinePlots = mockFarm.plots.filter(p => p.status !== 'offline');
  
  return {
    totalPlots: mockFarm.plots.length,
    okCount: mockFarm.plots.filter(p => p.status === 'ok').length,
    warningCount: mockFarm.plots.filter(p => p.status === 'warning').length,
    criticalCount: mockFarm.plots.filter(p => p.status === 'critical').length,
    offlineCount: mockFarm.plots.filter(p => p.status === 'offline').length,
    avgMoisture: onlinePlots.length > 0 
      ? onlinePlots.reduce((sum, p) => sum + p.currentSoilReading.moisture, 0) / onlinePlots.length 
      : 0,
    avgTemperature: onlinePlots.length > 0 
      ? onlinePlots.reduce((sum, p) => sum + p.currentSoilReading.temperature, 0) / onlinePlots.length 
      : 0,
    avgEc: onlinePlots.length > 0 
      ? onlinePlots.reduce((sum, p) => sum + p.currentSoilReading.ec, 0) / onlinePlots.length 
      : 0,
    avgPh: onlinePlots.length > 0 
      ? onlinePlots.reduce((sum, p) => sum + p.currentSoilReading.ph, 0) / onlinePlots.length 
      : 0,
    avgHealthScore: mockFarm.healthScore,
    totalFruitCount: onlinePlots.reduce((sum, p) => sum + p.currentVisionData.fruitCount, 0),
    estimatedYield: mockFarm.estimatedYield,
    activeAlerts: mockFarm.alerts.filter(a => !a.resolvedAt).length,
    irrigationIssues: mockFarm.alerts.filter(a => a.category === 'irrigation' && !a.resolvedAt).length,
    pestDetections: mockFarm.alerts.filter(a => a.category === 'pests' && !a.resolvedAt).length,
  };
}

// Get alerts by category
export function getAlertsByCategory(category?: AlertCategory): Alert[] {
  if (!category) return mockFarm.alerts;
  return mockFarm.alerts.filter(a => a.category === category);
}

// Get offline/low battery sensors
export function getSensorHealthIssues() {
  const issues: Array<{
    plotId: string;
    plotName: string;
    sensorId: string;
    sensorType: string;
    lastSignal: Date;
    batteryLevel: number;
    isOnline: boolean;
    issue: 'offline' | 'low_battery' | 'weak_signal';
  }> = [];
  
  mockFarm.plots.forEach(plot => {
    plot.sensors.forEach(sensor => {
      if (!sensor.isOnline) {
        issues.push({
          plotId: plot.id,
          plotName: plot.name,
          sensorId: sensor.id,
          sensorType: sensor.type,
          lastSignal: sensor.lastSignal,
          batteryLevel: sensor.batteryLevel,
          isOnline: sensor.isOnline,
          issue: 'offline',
        });
      } else if (sensor.batteryLevel < 30) {
        issues.push({
          plotId: plot.id,
          plotName: plot.name,
          sensorId: sensor.id,
          sensorType: sensor.type,
          lastSignal: sensor.lastSignal,
          batteryLevel: sensor.batteryLevel,
          isOnline: sensor.isOnline,
          issue: 'low_battery',
        });
      } else if (sensor.signalStrength < 40) {
        issues.push({
          plotId: plot.id,
          plotName: plot.name,
          sensorId: sensor.id,
          sensorType: sensor.type,
          lastSignal: sensor.lastSignal,
          batteryLevel: sensor.batteryLevel,
          isOnline: sensor.isOnline,
          issue: 'weak_signal',
        });
      }
    });
  });
  
  return issues;
}

// For backwards compatibility - Reading type alias
export type Reading = SoilReading;