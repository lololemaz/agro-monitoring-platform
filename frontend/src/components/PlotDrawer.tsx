import type { PlotWithReadings } from "@/types/plot";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription,
  SheetFooter 
} from "@/components/ui/sheet";
import { 
  Droplets, 
  Thermometer, 
  Zap, 
  FlaskConical,
  ArrowRight,
  Clock,
  Battery,
  Activity,
  Leaf,
  Target
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PlotDrawerProps {
  plot: PlotWithReadings | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlotDrawer({ plot, open, onOpenChange }: PlotDrawerProps) {
  const navigate = useNavigate();

  if (!plot) return null;

  const soil = plot.current_soil_reading;
  const vision = plot.current_vision_data;
  const status = plot.status || 'ok';
  const healthScore = plot.health_score || 50;

  const handleViewDetails = () => {
    onOpenChange(false);
    navigate(`/plot/${plot.id}`);
  };

  // Format last reading time
  const lastReadingTime = soil?.time 
    ? new Date(soil.time)
    : new Date(plot.updated_at);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-card border-border">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <SheetTitle className="text-2xl">{plot.name}</SheetTitle>
            <StatusBadge status={status} />
          </div>
          <SheetDescription>
            {plot.area} ha • {plot.crop_type}
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Health Score */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold",
              healthScore >= 70 ? "bg-status-ok-bg text-status-ok glow-status-ok" :
              healthScore >= 50 ? "bg-status-warning-bg text-status-warning glow-status-warning" :
              "bg-status-critical-bg text-status-critical glow-status-critical"
            )}>
              {healthScore}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pontuação de Saúde</p>
              <p className="text-lg font-semibold">
                {healthScore >= 70 ? 'Saudável' : healthScore >= 50 ? 'Atenção Necessária' : 'Crítico'}
              </p>
            </div>
          </div>

          {/* Current readings */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              icon={Droplets}
              iconColor="text-chart-moisture"
              label="Umidade"
              value={soil?.moisture != null
                ? `${Number(soil.moisture).toFixed(1)}%`
                : 'N/A'}
            />
            <MetricCard
              icon={Thermometer}
              iconColor="text-chart-temperature"
              label="Temperatura"
              value={soil?.temperature != null
                ? `${Number(soil.temperature).toFixed(1)}°C`
                : 'N/A'}
            />
            <MetricCard
              icon={Zap}
              iconColor="text-chart-ec"
              label="CE"
              value={soil?.ec != null
                ? `${Number(soil.ec).toFixed(2)} µS/cm`
                : 'N/A'}
            />
            <MetricCard
              icon={Target}
              iconColor="text-chart-ph"
              label="pH"
              value={soil?.ph != null
                ? Number(soil.ph).toFixed(1)
                : 'N/A'}
            />
            <MetricCard
              icon={Activity}
              iconColor="text-chart-health"
              label="NDVI"
              value={vision?.ndvi != null
                ? Number(vision.ndvi).toFixed(2)
                : 'N/A'}
            />
            <MetricCard
              icon={Leaf}
              iconColor="text-chart-nitrogen"
              label="Clorofila"
              value={vision?.chlorophyll_level != null
                ? `${Number(vision.chlorophyll_level).toFixed(0)}%`
                : 'N/A'}
            />
          </div>

          {/* Vision Data Summary */}
          {vision && (
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Dados de Visão Computacional
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Contagem de Frutos:</span>
                  <span className="ml-2 font-medium">{vision.fruit_count?.toLocaleString() || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tamanho Médio:</span>
                  <span className="ml-2 font-medium">
                    {vision.avg_fruit_size != null
                      ? `${Number(vision.avg_fruit_size).toFixed(0)}mm`
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Estresse Hídrico:</span>
                  <span className={cn(
                    "ml-2 font-medium",
                    vision.water_stress_level != null && Number(vision.water_stress_level) > 60 ? "text-status-critical" :
                    vision.water_stress_level != null && Number(vision.water_stress_level) > 40 ? "text-status-warning" :
                    "text-status-ok"
                  )}>
                    {vision.water_stress_level != null
                      ? `${Number(vision.water_stress_level).toFixed(0)}%`
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Maturação:</span>
                  <span className="ml-2 font-medium">
                    {vision.maturity_index != null
                      ? `${Number(vision.maturity_index).toFixed(0)}%`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Last reading info */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-3">
            <h4 className="font-medium text-sm">Última Leitura</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>
                  {format(lastReadingTime, "HH:mm", { locale: ptBR })}
                  <span className="text-xs ml-1">
                    ({formatDistanceToNow(lastReadingTime, { addSuffix: true, locale: ptBR })})
                  </span>
                </span>
              </div>
              {plot.sensors_count !== undefined && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Activity className="w-4 h-4" />
                  <span>{plot.sensors_count} sensor(es) ativo(s)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button onClick={handleViewDetails} className="w-full">
            Ver Detalhes
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  label: string;
  value: string;
}

function MetricCard({ icon: Icon, iconColor, label, value }: MetricCardProps) {
  return (
    <div className="p-3 rounded-lg border bg-card-elevated">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="font-semibold tabular-nums">{value}</p>
    </div>
  );
}
