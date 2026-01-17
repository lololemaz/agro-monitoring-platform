import { PlotProduction } from '@/hooks/useAnalytics';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
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

const stageLabels: Record<string, string> = {
  'floracao': 'Floracao',
  'frutificacao': 'Frutificacao',
  'crescimento': 'Crescimento',
  'maturacao': 'Maturacao',
  'pronto_colheita': 'Pronto Colheita',
};

const stageColors: Record<string, string> = {
  'floracao': '#ec4899',
  'frutificacao': '#f97316',
  'crescimento': '#22c55e',
  'maturacao': '#eab308',
  'pronto_colheita': '#10b981',
};

const stageProgress: Record<string, number> = {
  'floracao': 20,
  'frutificacao': 40,
  'crescimento': 60,
  'maturacao': 80,
  'pronto_colheita': 100,
};

const riskLabels: Record<string, string> = {
  'baixo': 'Baixo',
  'medio': 'Medio',
  'alto': 'Alto',
  'critico': 'Critico',
};

const riskColors: Record<string, string> = {
  'baixo': 'bg-status-ok/10 text-status-ok border-status-ok/30',
  'medio': 'bg-chart-temperature/10 text-chart-temperature border-chart-temperature/30',
  'alto': 'bg-status-warning/10 text-status-warning border-status-warning/30',
  'critico': 'bg-status-critical/10 text-status-critical border-status-critical/30',
};

export function PlotProductionCard({ plot, onClick, className }: PlotProductionCardProps) {
  const stage = plot.productionStage || 'floracao';
  const progress = stageProgress[stage] || 0;
  const stageColor = stageColors[stage] || '#6b7280';
  const stageLabel = stageLabels[stage] || stage;

  return (
    <div 
      className={cn(
        "bg-card border border-border rounded-lg p-4 cursor-pointer transition-all duration-200",
        "hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-lg">{plot.plotName}</h4>
            {plot.productionStage && (
              <Badge 
                variant="outline"
                className="text-xs"
                style={{ 
                  borderColor: stageColor,
                  color: stageColor,
                }}
              >
                {stageLabel}
              </Badge>
            )}
          </div>
          {plot.plotCode && (
            <p className="text-xs text-muted-foreground">{plot.plotCode}</p>
          )}
        </div>
        
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm",
          plot.healthScore >= 70 ? "bg-status-ok/20 text-status-ok" :
          plot.healthScore >= 50 ? "bg-status-warning/20 text-status-warning" :
          "bg-status-critical/20 text-status-critical"
        )}>
          {plot.healthScore}
        </div>
      </div>

      {plot.productionStage && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Progresso do Ciclo</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
          <Apple className="w-4 h-4 text-orange-500 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">Total Frutos</p>
            <p className="font-semibold tabular-nums">{(plot.totalFruits / 1000).toFixed(1)}k</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
          <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">Prod. Est.</p>
            <p className="font-semibold tabular-nums">{plot.estimatedYieldTons.toFixed(1)}t</p>
          </div>
        </div>

        {plot.avgFruitSize && (
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
            <Ruler className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">Tam. Medio</p>
              <p className="font-semibold tabular-nums">{plot.avgFruitSize.toFixed(0)}mm</p>
            </div>
          </div>
        )}

        {plot.fruitCaliber && (
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
            <div className="w-4 h-4 rounded-full bg-primary/20 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">Calibre</p>
              <p className="font-semibold text-sm capitalize">{plot.fruitCaliber.replace('_', ' ')}</p>
            </div>
          </div>
        )}
      </div>

      {plot.harvestStartDate && plot.harvestEndDate && (
        <div className="flex items-center justify-between p-2 bg-primary/5 rounded-md mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm">Colheita</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">
              {format(new Date(plot.harvestStartDate), 'dd MMM', { locale: ptBR })} - {format(new Date(plot.harvestEndDate), 'dd MMM', { locale: ptBR })}
            </p>
            {plot.daysToHarvest !== null && (
              <p className="text-xs text-muted-foreground">
                em {plot.daysToHarvest} dias
              </p>
            )}
          </div>
        </div>
      )}

      {plot.riskLevel && plot.riskLevel !== 'baixo' && (
        <div className={cn(
          "flex items-center gap-2 p-2 rounded-md border",
          riskColors[plot.riskLevel] || riskColors['medio']
        )}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium">Risco {riskLabels[plot.riskLevel] || plot.riskLevel}</p>
            {plot.riskFactors.length > 0 && (
              <p className="text-xs opacity-80 truncate">
                {plot.riskFactors.slice(0, 2).join(', ')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
