// Farm Events Data Model

export type EventType = 
  | 'irrigation' 
  | 'fertilization' 
  | 'nutrients' 
  | 'pesticide' 
  | 'pruning' 
  | 'soil_correction' 
  | 'maintenance' 
  | 'other';

export type EventScope = 'farm' | 'plot' | 'subarea' | 'tree_group';

export interface FarmEvent {
  id: string;
  type: EventType;
  scope: EventScope;
  scopeId?: string; // plotId, subarea id, etc.
  scopeName?: string;
  title: string;
  timestamp: Date;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
  
  // Type-specific structured data
  irrigationData?: {
    durationChange: number; // minutes (+/-)
    estimatedLiters: number;
    method: 'drip' | 'sprinkler' | 'flood' | 'manual';
    startTime?: Date;
    endTime?: Date;
  };
  
  fertilizationData?: {
    formulation: string; // e.g., "20-20-10"
    dose: number;
    doseUnit: 'kg/ha' | 'g/tree' | 'L/ha';
    applicationMethod: 'foliar' | 'soil' | 'fertigation' | 'manual';
    areaCoveredHa?: number;
  };
  
  productData?: {
    productName: string;
    dose: number;
    doseUnit: string;
    objective: string;
    supplier?: string;
    batchNumber?: string;
  };
  
  notes?: string;
  attachments?: {
    id: string;
    name: string;
    type: 'photo' | 'document' | 'invoice';
    url: string;
  }[];
  
  operator?: string;
  team?: string;
  
  // Audit
  tags?: ('corrective' | 'preventive' | 'experiment' | 'standard')[];
}

// Event type configuration
export const eventTypeConfig: Record<EventType, {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}> = {
  irrigation: {
    label: 'Irrigação',
    icon: 'Droplets',
    color: 'hsl(var(--chart-moisture))',
    bgColor: 'hsl(var(--chart-moisture) / 0.1)',
  },
  fertilization: {
    label: 'Fertilização',
    icon: 'Leaf',
    color: 'hsl(var(--chart-nitrogen))',
    bgColor: 'hsl(var(--chart-nitrogen) / 0.1)',
  },
  nutrients: {
    label: 'Nutrientes',
    icon: 'FlaskConical',
    color: 'hsl(var(--chart-phosphorus))',
    bgColor: 'hsl(var(--chart-phosphorus) / 0.1)',
  },
  pesticide: {
    label: 'Pesticida',
    icon: 'Bug',
    color: 'hsl(var(--status-warning))',
    bgColor: 'hsl(var(--status-warning) / 0.1)',
  },
  pruning: {
    label: 'Poda',
    icon: 'Scissors',
    color: 'hsl(var(--chart-potassium))',
    bgColor: 'hsl(var(--chart-potassium) / 0.1)',
  },
  soil_correction: {
    label: 'Correção de Solo',
    icon: 'Mountain',
    color: 'hsl(var(--chart-ec))',
    bgColor: 'hsl(var(--chart-ec) / 0.1)',
  },
  maintenance: {
    label: 'Manutenção',
    icon: 'Wrench',
    color: 'hsl(var(--muted-foreground))',
    bgColor: 'hsl(var(--muted) / 0.5)',
  },
  other: {
    label: 'Outro',
    icon: 'MoreHorizontal',
    color: 'hsl(var(--foreground))',
    bgColor: 'hsl(var(--muted) / 0.3)',
  },
};

export const scopeConfig: Record<EventScope, { label: string }> = {
  farm: { label: 'Fazenda' },
  plot: { label: 'Talhão' },
  subarea: { label: 'Sub-área' },
  tree_group: { label: 'Grupo de Árvores' },
};

// Generate mock events
function generateMockEvents(): FarmEvent[] {
  const events: FarmEvent[] = [];
  const now = new Date();
  const plotIds = ['T01', 'T02', 'T03', 'T04', 'T05', 'T08', 'T12', 'T15', 'T20', 'T25', 'T30', 'T35'];
  
  const eventTemplates: Partial<FarmEvent>[] = [
    {
      type: 'irrigation',
      title: 'Aumento de irrigação +30min',
      irrigationData: {
        durationChange: 30,
        estimatedLiters: 200,
        method: 'drip',
      },
      notes: 'Ajuste devido ao aumento de temperatura previsto para os próximos dias.',
      tags: ['preventive'],
    },
    {
      type: 'fertilization',
      title: 'Aplicação NPK 20-20-10',
      fertilizationData: {
        formulation: '20-20-10',
        dose: 150,
        doseUnit: 'kg/ha',
        applicationMethod: 'fertigation',
        areaCoveredHa: 4,
      },
      notes: 'Aplicação de manutenção conforme calendário agronômico.',
      tags: ['standard'],
    },
    {
      type: 'pesticide',
      title: 'Aplicação de fungicida preventivo',
      productData: {
        productName: 'Mancozeb 800 WP',
        dose: 2.5,
        doseUnit: 'kg/ha',
        objective: 'Prevenção de antracnose',
        supplier: 'Syngenta',
        batchNumber: 'LOT-2024-1234',
      },
      notes: 'Aplicação preventiva antes do período de chuvas.',
      tags: ['preventive'],
    },
    {
      type: 'irrigation',
      title: 'Redução de irrigação -20min',
      irrigationData: {
        durationChange: -20,
        estimatedLiters: -150,
        method: 'drip',
      },
      notes: 'Umidade do solo acima do ideal.',
      tags: ['corrective'],
    },
    {
      type: 'nutrients',
      title: 'Aplicação foliar de micronutrientes',
      productData: {
        productName: 'Quelato de Zinco + Boro',
        dose: 1.5,
        doseUnit: 'L/ha',
        objective: 'Correção de deficiência de Zn e B',
      },
      notes: 'Detectada clorose nas folhas novas.',
      tags: ['corrective'],
    },
    {
      type: 'pruning',
      title: 'Poda de formação',
      notes: 'Poda de ramos ladrões e formação de copa.',
      tags: ['standard'],
    },
    {
      type: 'soil_correction',
      title: 'Aplicação de calcário',
      fertilizationData: {
        formulation: 'Calcário dolomítico',
        dose: 2000,
        doseUnit: 'kg/ha',
        applicationMethod: 'soil',
        areaCoveredHa: 4,
      },
      notes: 'Correção de pH do solo (estava em 5.2).',
      tags: ['corrective'],
    },
    {
      type: 'maintenance',
      title: 'Manutenção do sistema de irrigação',
      notes: 'Substituição de gotejadores entupidos na linha 5-12.',
      tags: ['corrective'],
    },
    {
      type: 'fertilization',
      title: 'Aplicação de sulfato de potássio',
      fertilizationData: {
        formulation: 'K2SO4 (0-0-50)',
        dose: 100,
        doseUnit: 'kg/ha',
        applicationMethod: 'fertigation',
        areaCoveredHa: 4,
      },
      notes: 'Reposição de K para fase de maturação.',
      tags: ['standard'],
    },
    {
      type: 'other',
      title: 'Visita técnica do agrônomo',
      notes: 'Inspeção geral e coleta de amostras para análise.',
      tags: ['standard'],
    },
  ];
  
  // Generate events for the last 60 days
  for (let dayOffset = 0; dayOffset < 60; dayOffset++) {
    // 0-3 events per day
    const eventsPerDay = Math.floor(Math.random() * 4);
    
    for (let i = 0; i < eventsPerDay; i++) {
      const template = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
      const plotId = plotIds[Math.floor(Math.random() * plotIds.length)];
      const hour = 6 + Math.floor(Math.random() * 10); // 6 AM to 4 PM
      const minute = Math.floor(Math.random() * 60);
      
      const timestamp = new Date(now);
      timestamp.setDate(timestamp.getDate() - dayOffset);
      timestamp.setHours(hour, minute, 0, 0);
      
      const createdAt = new Date(timestamp);
      createdAt.setMinutes(createdAt.getMinutes() + Math.floor(Math.random() * 30));
      
      const event: FarmEvent = {
        id: `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: template.type!,
        scope: Math.random() > 0.2 ? 'plot' : 'farm',
        scopeId: Math.random() > 0.2 ? plotId : undefined,
        scopeName: Math.random() > 0.2 ? `Talhão ${plotId}` : 'Toda a Fazenda',
        title: template.title!,
        timestamp,
        createdAt,
        createdBy: ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa'][Math.floor(Math.random() * 4)],
        irrigationData: template.irrigationData,
        fertilizationData: template.fertilizationData,
        productData: template.productData,
        notes: template.notes,
        operator: ['Equipe A', 'Equipe B', 'Equipe C'][Math.floor(Math.random() * 3)],
        tags: template.tags,
      };
      
      events.push(event);
    }
  }
  
  // Sort by timestamp descending
  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export const farmEvents = generateMockEvents();

// Helper to get events for a specific plot
export function getPlotEvents(plotId: string): FarmEvent[] {
  return farmEvents.filter(e => e.scopeId === plotId || e.scope === 'farm');
}

// Helper to get events in a date range
export function getEventsInRange(startDate: Date, endDate: Date, plotId?: string): FarmEvent[] {
  return farmEvents.filter(e => {
    const inRange = e.timestamp >= startDate && e.timestamp <= endDate;
    if (!inRange) return false;
    if (plotId) return e.scopeId === plotId || e.scope === 'farm';
    return true;
  });
}

// Get event summary for display
export function getEventSummary(event: FarmEvent): string {
  if (event.irrigationData) {
    const sign = event.irrigationData.durationChange > 0 ? '+' : '';
    return `${sign}${event.irrigationData.durationChange}min, ${sign}${event.irrigationData.estimatedLiters}L`;
  }
  if (event.fertilizationData) {
    return `${event.fertilizationData.formulation} - ${event.fertilizationData.dose} ${event.fertilizationData.doseUnit}`;
  }
  if (event.productData) {
    return `${event.productData.productName} - ${event.productData.dose} ${event.productData.doseUnit}`;
  }
  return event.notes?.substring(0, 50) || '';
}
