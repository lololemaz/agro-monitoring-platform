import { HeatmapMetricType, metricConfigs, getUniquePlots, TreeData } from "@/data/heatmapData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { 
  Droplets, 
  Thermometer, 
  Zap, 
  FlaskConical, 
  Leaf,
  Apple,
  Sun,
  Sparkles,
  Info,
  RotateCcw
} from "lucide-react";

interface HeatmapFiltersProps {
  trees: TreeData[];
  selectedMetric: HeatmapMetricType;
  onMetricChange: (metric: HeatmapMetricType) => void;
  selectedPlotId?: string;
  onPlotChange: (plotId?: string) => void;
  showCriticalOnly: boolean;
  onShowCriticalOnlyChange: (value: boolean) => void;
  showOutliers: boolean;
  onShowOutliersChange: (value: boolean) => void;
  onReset: () => void;
  className?: string;
}

const metricIcons: Record<HeatmapMetricType, React.ReactNode> = {
  soilMoisture: <Droplets className="w-4 h-4" />,
  temperature: <Thermometer className="w-4 h-4" />,
  electricalConductivity: <Zap className="w-4 h-4" />,
  ph: <FlaskConical className="w-4 h-4" />,
  nitrogen: <Leaf className="w-4 h-4 text-green-500" />,
  potassium: <Leaf className="w-4 h-4 text-orange-500" />,
  phosphorus: <Leaf className="w-4 h-4 text-pink-500" />,
  chlorophyllIndex: <Sparkles className="w-4 h-4" />,
  mangoCount: <Apple className="w-4 h-4" />,
  limeApplication: <Sun className="w-4 h-4" />,
};

export function HeatmapFilters({
  trees,
  selectedMetric,
  onMetricChange,
  selectedPlotId,
  onPlotChange,
  showCriticalOnly,
  onShowCriticalOnlyChange,
  showOutliers,
  onShowOutliersChange,
  onReset,
  className,
}: HeatmapFiltersProps) {
  const plots = getUniquePlots(trees);
  const config = metricConfigs[selectedMetric];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Metric Selector */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Métrica
          </Label>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-3 h-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-[200px]">
              <p className="text-xs">{config.description}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Select value={selectedMetric} onValueChange={(v) => onMetricChange(v as HeatmapMetricType)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(metricConfigs).map((m) => (
              <SelectItem key={m.key} value={m.key}>
                <div className="flex items-center gap-2">
                  {metricIcons[m.key]}
                  <span>{m.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Plot Filter */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Talhão
        </Label>
        <Select value={selectedPlotId || 'all'} onValueChange={(v) => onPlotChange(v === 'all' ? undefined : v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Todos os talhões" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os talhões</SelectItem>
            {plots.map((plot) => (
              <SelectItem key={plot.id} value={plot.id}>
                {plot.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Toggle Filters */}
      <div className="space-y-3 pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <Label htmlFor="critical-only" className="text-sm cursor-pointer">
            Apenas zonas críticas
          </Label>
          <Switch
            id="critical-only"
            checked={showCriticalOnly}
            onCheckedChange={onShowCriticalOnlyChange}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="outliers" className="text-sm cursor-pointer">
            Destacar outliers
          </Label>
          <Switch
            id="outliers"
            checked={showOutliers}
            onCheckedChange={onShowOutliersChange}
          />
        </div>
      </div>

      {/* Reset */}
      <Button variant="outline" size="sm" className="w-full mt-2" onClick={onReset}>
        <RotateCcw className="w-4 h-4 mr-2" />
        Resetar filtros
      </Button>
    </div>
  );
}
