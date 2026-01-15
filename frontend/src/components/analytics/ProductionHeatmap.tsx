import { useMemo, useState } from 'react';
import { 
  PlotProduction, 
  ProductionStage, 
  productionStageLabels,
  productionStageColors 
} from '@/data/analyticsData';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Thermometer, Droplets, Apple, Flower2, Activity } from 'lucide-react';

type HeatmapMetric = 'stage' | 'yield' | 'health' | 'flowers' | 'fruits';

interface ProductionHeatmapProps {
  data: PlotProduction[];
  onPlotClick?: (plot: PlotProduction) => void;
  className?: string;
}

const metricOptions: { value: HeatmapMetric; label: string; icon: React.ElementType }[] = [
  { value: 'stage', label: 'Estágio de Produção', icon: Flower2 },
  { value: 'yield', label: 'Produtividade Estimada', icon: Apple },
  { value: 'health', label: 'Saúde do Talhão', icon: Activity },
  { value: 'flowers', label: 'Densidade de Flores', icon: Flower2 },
  { value: 'fruits', label: 'Contagem de Frutos', icon: Apple },
];

function getColorForMetric(plot: PlotProduction, metric: HeatmapMetric): string {
  switch (metric) {
    case 'stage':
      return productionStageColors[plot.productionStage];
    case 'yield': {
      const ratio = Math.min(plot.estimatedYieldKg / 16000, 1);
      if (ratio > 0.7) return 'hsl(152, 70%, 45%)';
      if (ratio > 0.4) return 'hsl(45, 85%, 55%)';
      return 'hsl(0, 70%, 55%)';
    }
    case 'health': {
      if (plot.healthScore >= 70) return 'hsl(152, 70%, 45%)';
      if (plot.healthScore >= 50) return 'hsl(45, 85%, 55%)';
      return 'hsl(0, 70%, 55%)';
    }
    case 'flowers': {
      const ratio = plot.floweringPercentage / 100;
      return `hsl(300, ${60 + ratio * 30}%, ${40 + ratio * 20}%)`;
    }
    case 'fruits': {
      const ratio = Math.min(plot.totalFruits / 4000, 1);
      if (ratio > 0.7) return 'hsl(152, 70%, 45%)';
      if (ratio > 0.4) return 'hsl(45, 85%, 55%)';
      return 'hsl(0, 70%, 55%)';
    }
    default:
      return 'hsl(var(--muted))';
  }
}

function getValueLabel(plot: PlotProduction, metric: HeatmapMetric): string {
  switch (metric) {
    case 'stage':
      return productionStageLabels[plot.productionStage];
    case 'yield':
      return `${(plot.estimatedYieldKg / 1000).toFixed(1)}t`;
    case 'health':
      return `${plot.healthScore}%`;
    case 'flowers':
      return `${plot.floweringPercentage.toFixed(0)}%`;
    case 'fruits':
      return `${(plot.totalFruits / 1000).toFixed(1)}k`;
    default:
      return '';
  }
}

export function ProductionHeatmap({ data, onPlotClick, className }: ProductionHeatmapProps) {
  const [metric, setMetric] = useState<HeatmapMetric>('stage');
  const [hoveredPlot, setHoveredPlot] = useState<string | null>(null);
  
  const gridData = useMemo(() => {
    const maxRow = Math.max(...data.map(p => p.gridPosition.row));
    const maxCol = Math.max(...data.map(p => p.gridPosition.col));
    return { maxRow, maxCol, plots: data };
  }, [data]);

  const MetricIcon = metricOptions.find(m => m.value === metric)?.icon || Activity;

  return (
    <div className={cn("bg-card border border-border rounded-lg p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MetricIcon className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Mapa de Calor da Fazenda</h3>
        </div>
        <Select value={metric} onValueChange={(v) => setMetric(v as HeatmapMetric)}>
          <SelectTrigger className="w-[200px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {metricOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                <div className="flex items-center gap-2">
                  <opt.icon className="w-4 h-4" />
                  {opt.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Legend */}
      {metric === 'stage' && (
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.entries(productionStageLabels) as [ProductionStage, string][]).map(([stage, label]) => (
            <div key={stage} className="flex items-center gap-1.5">
              <div 
                className="w-3 h-3 rounded-sm" 
                style={{ backgroundColor: productionStageColors[stage] }}
              />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      )}

      {metric !== 'stage' && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-muted-foreground">Baixo</span>
          <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-status-critical via-status-warning to-status-ok" />
          <span className="text-xs text-muted-foreground">Alto</span>
        </div>
      )}

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div 
          className="grid gap-1 min-w-fit"
          style={{ 
            gridTemplateColumns: `repeat(${gridData.maxCol + 1}, minmax(48px, 1fr))` 
          }}
        >
          {gridData.plots.map(plot => (
            <Tooltip key={plot.plotId}>
              <TooltipTrigger asChild>
                <button
                  className={cn(
                    "aspect-square rounded-md flex flex-col items-center justify-center text-xs font-medium transition-all duration-200",
                    "hover:scale-105 hover:shadow-lg hover:z-10 relative",
                    hoveredPlot === plot.plotId && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                  style={{ 
                    backgroundColor: getColorForMetric(plot, metric),
                    color: metric === 'stage' ? 'white' : 'white',
                  }}
                  onClick={() => onPlotClick?.(plot)}
                  onMouseEnter={() => setHoveredPlot(plot.plotId)}
                  onMouseLeave={() => setHoveredPlot(null)}
                >
                  <span className="font-bold drop-shadow-sm">{plot.plotName}</span>
                  <span className="text-[10px] opacity-90 drop-shadow-sm">
                    {getValueLabel(plot, metric)}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-2">
                  <div className="font-semibold flex items-center gap-2">
                    {plot.plotName}
                    <Badge variant="outline" className="text-xs">
                      {productionStageLabels[plot.productionStage]}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div>
                      <span className="text-muted-foreground">Árvores:</span>{' '}
                      <span className="font-medium">{plot.treeCount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Saúde:</span>{' '}
                      <span className="font-medium">{plot.healthScore}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Flores/árvore:</span>{' '}
                      <span className="font-medium">{plot.flowersPerTree}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Frutos/árvore:</span>{' '}
                      <span className="font-medium">{plot.fruitsPerTree}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Prod. Est.:</span>{' '}
                      <span className="font-medium">{plot.estimatedYieldTons.toFixed(1)}t</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Dias p/ colheita:</span>{' '}
                      <span className="font-medium">{plot.daysToHarvest}</span>
                    </div>
                  </div>
                  {plot.riskFactors.length > 0 && (
                    <div className="pt-1 border-t border-border">
                      <span className="text-xs text-status-warning">
                        ⚠ {plot.riskFactors.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  );
}
