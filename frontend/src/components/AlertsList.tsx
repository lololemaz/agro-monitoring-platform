import { cn } from "@/lib/utils";
import type { Alert, AlertCategory } from "@/types/alert";
import { 
  Droplets, 
  Thermometer, 
  Zap, 
  FlaskConical, 
  WifiOff,
  AlertTriangle,
  XCircle,
  Bug,
  Leaf,
  TrendingDown,
  Waves,
  Info
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface AlertsListProps {
  alerts: Alert[];
  onAlertClick?: (alert: Alert) => void;
  className?: string;
  maxHeight?: string;
  showCategory?: boolean;
}

type FilterType = 'all' | 'critical' | 'warning' | 'info';

const categoryIcons: Record<AlertCategory, React.ComponentType<{ className?: string }>> = {
  irrigation: Waves,
  soil: FlaskConical,
  pests: Bug,
  health: Leaf,
  production: TrendingDown,
  system: WifiOff,
};

const categoryColors: Record<AlertCategory, string> = {
  irrigation: 'text-chart-moisture',
  soil: 'text-chart-ec',
  pests: 'text-status-warning',
  health: 'text-chart-nitrogen',
  production: 'text-chart-potassium',
  system: 'text-status-offline',
};

export function AlertsList({ 
  alerts, 
  onAlertClick, 
  className,
  maxHeight = "400px",
  showCategory = false
}: AlertsListProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    return alert.severity === filter;
  });

  const filterCounts = {
    all: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    info: alerts.filter(a => a.severity === 'info').length,
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {(['all', 'critical', 'warning'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className={cn(
              "text-xs",
              filter === f && f === 'critical' && "bg-status-critical hover:bg-status-critical/90",
              filter === f && f === 'warning' && "bg-status-warning hover:bg-status-warning/90 text-background"
            )}
          >
            {f === 'all' && 'Todos'}
            {f === 'critical' && 'Críticos'}
            {f === 'warning' && 'Atenção'}
            <span className="ml-1 opacity-70">({filterCounts[f]})</span>
          </Button>
        ))}
      </div>

      <ScrollArea style={{ height: maxHeight }} className="pr-4">
        <div className="space-y-2">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum alerta encontrado</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const CategoryIcon = categoryIcons[alert.category];
              const categoryColor = categoryColors[alert.category];
              
              return (
                <button
                  key={alert.id}
                  onClick={() => onAlertClick?.(alert)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-all duration-200",
                    "hover:shadow-md hover:scale-[1.01]",
                    alert.severity === 'critical' && "bg-status-critical-bg border-status-critical-border",
                    alert.severity === 'warning' && "bg-status-warning-bg border-status-warning-border",
                    alert.severity === 'info' && "bg-primary/5 border-primary/20"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-1.5 rounded-md",
                      alert.severity === 'critical' ? "bg-status-critical/20" : 
                      alert.severity === 'warning' ? "bg-status-warning/20" : "bg-primary/10"
                    )}>
                      <CategoryIcon className={cn("w-4 h-4", categoryColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-sm">{alert.title}</span>
                        {alert.severity === 'critical' ? (
                          <XCircle className="w-3.5 h-3.5 text-status-critical flex-shrink-0" />
                        ) : alert.severity === 'warning' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-status-warning flex-shrink-0" />
                        ) : (
                          <Info className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {alert.plot_name ? `Talhão ${alert.plot_name}` : alert.farm_name || 'Fazenda'}
                        {alert.row_id && ` • Linha ${alert.row_id}`}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {alert.message}
                      </p>
                      {alert.recurrence_count > 1 && (
                        <p className="text-xs text-status-warning mt-1">
                          ⚠️ Ocorreu {alert.recurrence_count} vezes
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(alert.timestamp), { 
                            addSuffix: true,
                            locale: ptBR 
                          })}
                        </p>
                        {showCategory && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                            {alert.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
