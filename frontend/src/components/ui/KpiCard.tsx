import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'ok' | 'warning' | 'critical' | 'offline';
  className?: string;
}

export function KpiCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  variant = 'default',
  className 
}: KpiCardProps) {
  const variantStyles = {
    default: 'bg-card border-border',
    ok: 'bg-status-ok-bg border-status-ok/30',
    warning: 'bg-status-warning-bg border-status-warning/30',
    critical: 'bg-status-critical-bg border-status-critical/30',
    offline: 'bg-status-offline-bg border-status-offline/30',
  };

  const iconStyles = {
    default: 'text-muted-foreground',
    ok: 'text-status-ok',
    warning: 'text-status-warning',
    critical: 'text-status-critical',
    offline: 'text-status-offline',
  };

  return (
    <div 
      className={cn(
        "rounded-lg border p-4 transition-all duration-200 hover:shadow-card-hover",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="data-label">{title}</p>
          <p className="data-value text-foreground">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p className={cn(
              "text-xs font-medium",
              trend.isPositive ? "text-status-ok" : "text-status-critical"
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "p-2 rounded-md bg-background/50",
            iconStyles[variant]
          )}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
