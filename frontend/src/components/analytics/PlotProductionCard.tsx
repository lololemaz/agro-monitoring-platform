import { PlotProduction, productionStageLabels, productionStageColors, riskLevelLabels } from '@/data/analyticsData';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { 
  TreeDeciduous, 
  Flower2, 
  Apple, 
  Calendar, 
  AlertTriangle,
  TrendingUp,
  Ruler
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PlotProductionCardProps {
  plot: PlotProduction;
  onClick?: () => void;
  className?: string;
}

export function PlotProductionCard({ plot, onClick, className }: PlotProductionCardProps) {
  const stageProgress = {
    'floração': 20,
    'frutificação': 40,
    'crescimento': 60,
    'maturação': 80,
    'pronto_colheita': 100,
  }[plot.productionStage];

  const riskColors = {
    'baixo': 'bg-status-ok/10 text-status-ok border-status-ok/30',
    'médio': 'bg-chart-temperature/10 text-chart-temperature border-chart-temperature/30',
    'alto': 'bg-status-warning/10 text-status-warning border-status-warning/30',
    'crítico': 'bg-status-critical/10 text-status-critical border-status-critical/30',
  };

  return (
    <div 
      className={cn(
        "bg-card border border-border rounded-lg p-4 cursor-pointer transition-all duration-200",
        "hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5",
        className
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-lg">{plot.plotName}</h4>
            <Badge 
              variant="outline"
              className="text-xs"
              style={{ 
                borderColor: productionStageColors[plot.productionStage],
                color: productionStageColors[plot.productionStage],
              }}
            >
              {productionStageLabels[plot.productionStage]}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{plot.area} ha • {plot.treeCount} árvores</p>
        </div>
        
        {/* Health Score */}
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm",
          plot.healthScore >= 70 ? "bg-status-ok/20 text-status-ok" :
          plot.healthScore >= 50 ? "bg-status-warning/20 text-status-warning" :
          "bg-status-critical/20 text-status-critical"
        )}>
          {plot.healthScore}
        </div>
      </div>

      {/* Stage Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">Progresso do Ciclo</span>
          <span className="font-medium">{stageProgress}%</span>
        </div>
        <Progress 
          value={stageProgress} 
          className="h-2"
          style={{ 
            // @ts-ignore
            '--progress-color': productionStageColors[plot.productionStage] 
          }}
        />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
              <Flower2 className="w-4 h-4 text-pink-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Flores/Árv</p>
                <p className="font-semibold tabular-nums">{plot.flowersPerTree}</p>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            Total: {(plot.totalFlowers / 1000).toFixed(0)}k flores
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
              <Apple className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Frutos/Árv</p>
                <p className="font-semibold tabular-nums">{plot.fruitsPerTree}</p>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            Total: {(plot.totalFruits / 1000).toFixed(1)}k frutos
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
              <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Prod. Est.</p>
                <p className="font-semibold tabular-nums">{plot.estimatedYieldTons.toFixed(1)}t</p>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {plot.estimatedYieldKg.toLocaleString('pt-BR')} kg
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
              <Ruler className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Calibre Médio</p>
                <p className="font-semibold tabular-nums">{plot.avgFruitSize.toFixed(0)}g</p>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            Classificação: {plot.fruitCaliber.replace('_', ' ')}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Harvest Info */}
      <div className="flex items-center justify-between p-2 bg-primary/5 rounded-md mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-sm">Colheita</span>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">
            {format(plot.harvestStartDate, 'dd MMM', { locale: ptBR })} - {format(plot.harvestEndDate, 'dd MMM', { locale: ptBR })}
          </p>
          <p className="text-xs text-muted-foreground">
            em {plot.daysToHarvest} dias
          </p>
        </div>
      </div>

      {/* Risk Indicator */}
      {plot.riskLevel !== 'baixo' && (
        <div className={cn(
          "flex items-center gap-2 p-2 rounded-md border",
          riskColors[plot.riskLevel]
        )}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium">Risco {riskLevelLabels[plot.riskLevel]}</p>
            <p className="text-xs opacity-80 truncate">
              {plot.riskFactors.slice(0, 2).join(', ')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
