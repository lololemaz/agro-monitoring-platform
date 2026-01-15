import { cn } from "@/lib/utils";
import { Status } from "@/data/mockData";
import { CheckCircle2, AlertTriangle, XCircle, WifiOff } from "lucide-react";

interface StatusBadgeProps {
  status: Status;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig = {
  ok: {
    label: 'OK',
    icon: CheckCircle2,
    classes: 'status-ok',
  },
  warning: {
    label: 'Atenção',
    icon: AlertTriangle,
    classes: 'status-warning',
  },
  critical: {
    label: 'Crítico',
    icon: XCircle,
    classes: 'status-critical',
  },
  offline: {
    label: 'Offline',
    icon: WifiOff,
    classes: 'status-offline',
  },
};

const sizeClasses = {
  sm: 'px-1.5 py-0.5 text-xs gap-1',
  md: 'px-2 py-1 text-sm gap-1.5',
  lg: 'px-3 py-1.5 text-base gap-2',
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function StatusBadge({ 
  status, 
  showLabel = true, 
  size = 'md',
  className 
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span 
      className={cn(
        "inline-flex items-center rounded-full font-medium border",
        config.classes,
        sizeClasses[size],
        className
      )}
    >
      <Icon className={cn(iconSizes[size], status === 'critical' && 'animate-pulse-status')} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
