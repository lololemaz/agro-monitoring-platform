import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Droplets, Thermometer, Clock, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { PlotWithReadings, PlotStatus } from "@/types/plot";

interface PlotCardProps {
  plot: PlotWithReadings;
  onClick?: () => void;
  className?: string;
}

export function PlotCard({ plot, onClick, className }: PlotCardProps) {
  const soil = plot.current_soil_reading;
  const vision = plot.current_vision_data;
  const status: PlotStatus = plot.status || 'ok';
  const healthScore = plot.health_score || 50;
  
  // Get last reading time from soil reading or fall back to updated_at
  const lastReadingTime = soil?.time 
    ? formatDistanceToNow(new Date(soil.time), { addSuffix: true, locale: ptBR })
    : formatDistanceToNow(new Date(plot.updated_at), { addSuffix: true, locale: ptBR });

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-lg border bg-card transition-all duration-300",
        "hover:shadow-card-hover hover:-translate-y-0.5 hover:border-primary/30",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
        status === 'critical' && "border-status-critical-border bg-status-critical-bg/30",
        status === 'warning' && "border-status-warning-border bg-status-warning-bg/30",
        status === 'offline' && "opacity-60 border-status-offline-border",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">{plot.name}</h3>
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
            healthScore >= 70 ? "bg-status-ok-bg text-status-ok" :
            healthScore >= 50 ? "bg-status-warning-bg text-status-warning" :
            "bg-status-critical-bg text-status-critical"
          )}>
            {healthScore}
          </div>
        </div>
        <StatusBadge status={status} size="sm" />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="flex items-center gap-1.5">
          <Droplets className="w-4 h-4 text-chart-moisture" />
          <div>
            <p className="text-sm font-medium tabular-nums">
              {soil?.moisture !== null && soil?.moisture !== undefined
                ? `${soil.moisture.toFixed(1)}%`
                : 'N/A'}
            </p>
            <p className="text-[10px] text-muted-foreground">Umidade</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Thermometer className="w-4 h-4 text-chart-temperature" />
          <div>
            <p className="text-sm font-medium tabular-nums">
              {soil?.temperature !== null && soil?.temperature !== undefined
                ? `${soil.temperature.toFixed(1)}°C`
                : 'N/A'}
            </p>
            <p className="text-[10px] text-muted-foreground">Temp</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-chart-health" />
          <div>
            <p className="text-sm font-medium tabular-nums">
              {vision?.ndvi !== null && vision?.ndvi !== undefined
                ? vision.ndvi.toFixed(2)
                : 'N/A'}
            </p>
            <p className="text-[10px] text-muted-foreground">NDVI</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="w-3 h-3" />
        <span>{lastReadingTime}</span>
      </div>
    </button>
  );
}
