import { 
  Droplets, 
  Leaf, 
  FlaskConical, 
  Bug, 
  Scissors, 
  Mountain, 
  Wrench, 
  MoreHorizontal,
  Apple
} from 'lucide-react';
import type { EventType } from '@/types/event';
import { cn } from '@/lib/utils';

interface EventTypeIconProps {
  type: EventType;
  size?: 'sm' | 'md' | 'lg';
  showBackground?: boolean;
  className?: string;
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
  harvest: {
    label: 'Colheita',
    icon: 'Apple',
    color: 'hsl(var(--chart-health))',
    bgColor: 'hsl(var(--chart-health) / 0.1)',
  },
  other: {
    label: 'Outro',
    icon: 'MoreHorizontal',
    color: 'hsl(var(--foreground))',
    bgColor: 'hsl(var(--muted) / 0.3)',
  },
};

const iconComponents = {
  Droplets,
  Leaf,
  FlaskConical,
  Bug,
  Scissors,
  Mountain,
  Wrench,
  MoreHorizontal,
  Apple,
};

const sizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

const bgSizeClasses = {
  sm: 'w-5 h-5',
  md: 'w-7 h-7',
  lg: 'w-9 h-9',
};

export function EventTypeIcon({ type, size = 'md', showBackground = false, className }: EventTypeIconProps) {
  const config = eventTypeConfig[type] || eventTypeConfig.other;
  const IconComponent = iconComponents[config.icon as keyof typeof iconComponents] || MoreHorizontal;

  if (showBackground) {
    return (
      <div 
        className={cn("rounded-full flex items-center justify-center", bgSizeClasses[size], className)}
        style={{ backgroundColor: config.bgColor }}
      >
        <IconComponent className={sizeClasses[size]} style={{ color: config.color }} />
      </div>
    );
  }

  return (
    <IconComponent 
      className={cn(sizeClasses[size], className)} 
      style={{ color: config.color }} 
    />
  );
}

// Helper to get event summary for display
export function getEventSummary(event: { 
  irrigation_data?: { duration_minutes?: number; water_volume_liters?: number } | null;
  fertilization_data?: { product_name?: string; quantity_kg?: number; npk_ratio?: string } | null;
  product_data?: { product_name?: string; quantity?: number; unit?: string } | null;
  notes?: string | null;
}): string {
  if (event.irrigation_data) {
    const duration = event.irrigation_data.duration_minutes;
    const volume = event.irrigation_data.water_volume_liters;
    const parts = [];
    if (duration) parts.push(`${duration}min`);
    if (volume) parts.push(`${volume}L`);
    return parts.join(', ') || 'Irrigação realizada';
  }
  if (event.fertilization_data) {
    const data = event.fertilization_data;
    if (data.npk_ratio) return `${data.npk_ratio} - ${data.quantity_kg || 0} kg`;
    if (data.product_name) return `${data.product_name} - ${data.quantity_kg || 0} kg`;
    return 'Fertilização aplicada';
  }
  if (event.product_data) {
    const data = event.product_data;
    return `${data.product_name || 'Produto'} - ${data.quantity || 0} ${data.unit || ''}`;
  }
  return event.notes?.substring(0, 50) || '';
}
