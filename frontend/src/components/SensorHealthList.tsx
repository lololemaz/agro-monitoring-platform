import { cn } from "@/lib/utils";
import type { SensorHealthIssue } from "@/services/sensorsService";
import { WifiOff, BatteryLow, Clock, Signal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SensorHealthListProps {
  issues?: SensorHealthIssue[];
  className?: string;
  maxHeight?: string;
  isLoading?: boolean;
}

export function SensorHealthList({ 
  issues = [], 
  className, 
  maxHeight = "250px",
  isLoading = false 
}: SensorHealthListProps) {

  if (isLoading) {
    return (
      <div className={cn("", className)}>
        <div className="flex items-center justify-center py-8">
          <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("", className)}>
      <ScrollArea style={{ height: maxHeight }} className="pr-4">
        <div className="space-y-2">
          {issues.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <WifiOff className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Todos os sensores online</p>
            </div>
          ) : (
            issues.map((sensor) => (
              <div
                key={sensor.sensor_id}
                className={cn(
                  "p-3 rounded-lg border",
                  sensor.issue === 'offline' 
                    ? "bg-status-offline-bg border-status-offline/30"
                    : sensor.issue === 'low_battery'
                    ? "bg-status-warning-bg border-status-warning/30"
                    : "bg-yellow-500/5 border-yellow-500/20"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-md",
                    sensor.issue === 'offline' 
                      ? "bg-status-offline/10"
                      : sensor.issue === 'low_battery'
                      ? "bg-status-warning/10"
                      : "bg-yellow-500/10"
                  )}>
                    {sensor.issue === 'offline' ? (
                      <WifiOff className="w-4 h-4 text-status-offline" />
                    ) : sensor.issue === 'low_battery' ? (
                      <BatteryLow className="w-4 h-4 text-status-warning" />
                    ) : (
                      <Signal className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{sensor.sensor_name}</span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        sensor.issue === 'offline' 
                          ? "bg-status-offline/20 text-status-offline"
                          : sensor.issue === 'low_battery'
                          ? "bg-status-warning/20 text-status-warning"
                          : "bg-yellow-500/20 text-yellow-600"
                      )}>
                        {sensor.issue === 'offline' ? 'Offline' : 
                         sensor.issue === 'low_battery' ? 'Bateria Baixa' : 
                         'Sinal Fraco'}
                      </span>
                    </div>
                    {sensor.plot_name && (
                      <p className="text-xs text-muted-foreground">
                        Talhão {sensor.plot_name}
                      </p>
                    )}
                    {sensor.last_signal_at && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          Último sinal: {formatDistanceToNow(new Date(sensor.last_signal_at), { 
                            addSuffix: true,
                            locale: ptBR 
                          })}
                        </span>
                      </div>
                    )}
                    {sensor.issue === 'low_battery' && sensor.battery_level != null && (
                      <p className="text-xs text-status-warning mt-0.5">
                        Bateria: {Number(sensor.battery_level).toFixed(0)}%
                      </p>
                    )}
                    {sensor.issue === 'weak_signal' && sensor.signal_strength != null && (
                      <p className="text-xs text-yellow-600 mt-0.5">
                        Sinal: {Number(sensor.signal_strength).toFixed(0)}%
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
