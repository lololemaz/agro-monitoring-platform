import { FarmProductionStats, productionStageLabels, riskLevelLabels, ProductionStage, RiskLevel } from '@/data/analyticsData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  TreeDeciduous, 
  Flower2, 
  Apple, 
  TrendingUp,
  Calendar,
  AlertTriangle,
  Scale,
  Activity
} from 'lucide-react';

interface FarmSummaryCardsProps {
  stats: FarmProductionStats;
  className?: string;
}

export function FarmSummaryCards({ stats, className }: FarmSummaryCardsProps) {
  const totalPlots = Object.values(stats.plotsByStage).reduce((a, b) => a + b, 0);

  const stageColors: Record<ProductionStage, string> = {
    'floração': 'bg-pink-500',
    'frutificação': 'bg-amber-500',
    'crescimento': 'bg-emerald-500',
    'maturação': 'bg-orange-500',
    'pronto_colheita': 'bg-red-500',
  };

  const riskColors: Record<RiskLevel, string> = {
    'baixo': 'bg-status-ok',
    'médio': 'bg-chart-temperature',
    'alto': 'bg-status-warning',
    'crítico': 'bg-status-critical',
  };

  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
      {/* Total Trees & Yield */}
      <Card className="col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TreeDeciduous className="w-4 h-4" />
            Visão Geral
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-2xl font-bold">{stats.totalTrees.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-muted-foreground">Árvores em produção</p>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Prod. Total Est.</span>
            <span className="font-semibold text-primary">{stats.totalEstimatedYieldTons.toFixed(0)}t</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Variabilidade</span>
            <span className={cn(
              "font-semibold",
              stats.variabilityIndex < 15 ? "text-status-ok" : 
              stats.variabilityIndex < 25 ? "text-status-warning" : "text-status-critical"
            )}>
              {stats.variabilityIndex}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Flowers & Fruits */}
      <Card className="col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Flower2 className="w-4 h-4" />
            Flores & Frutos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xl font-bold">{(stats.totalFlowers / 1000000).toFixed(1)}M</p>
              <p className="text-xs text-muted-foreground">Total de Flores</p>
            </div>
            <div>
              <p className="text-xl font-bold">{(stats.totalFruits / 1000000).toFixed(1)}M</p>
              <p className="text-xs text-muted-foreground">Total de Frutos</p>
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Média por árvore</span>
            <span className="font-medium">
              <span className="text-pink-500">{stats.avgFlowersPerTree}</span> / 
              <span className="text-orange-500 ml-1">{stats.avgFruitsPerTree}</span>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Harvest Forecast */}
      <Card className="col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Previsão de Colheita
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Próximos 7 dias</span>
            <span className="font-semibold">{(stats.harvestNext7Days / 1000).toFixed(1)}t</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Próximos 14 dias</span>
            <span className="font-semibold">{(stats.harvestNext14Days / 1000).toFixed(1)}t</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Próximos 30 dias</span>
            <span className="font-semibold">{(stats.harvestNext30Days / 1000).toFixed(1)}t</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Próximos 60 dias</span>
            <span className="font-semibold text-primary">{(stats.harvestNext60Days / 1000).toFixed(1)}t</span>
          </div>
        </CardContent>
      </Card>

      {/* Risk Overview */}
      <Card className="col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Indicadores de Risco
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(Object.entries(stats.plotsByRisk) as [RiskLevel, number][]).map(([risk, count]) => (
            <div key={risk} className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded-full", riskColors[risk])} />
              <span className="text-sm flex-1">{riskLevelLabels[risk]}</span>
              <span className="text-sm font-semibold">{count}</span>
              <span className="text-xs text-muted-foreground">
                ({((count / totalPlots) * 100).toFixed(0)}%)
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Production Stages Distribution */}
      <Card className="col-span-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Distribuição por Estágio de Produção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-4 rounded-full overflow-hidden mb-4">
            {(Object.entries(stats.plotsByStage) as [ProductionStage, number][]).map(([stage, count]) => (
              <div
                key={stage}
                className={cn("transition-all", stageColors[stage])}
                style={{ width: `${(count / totalPlots) * 100}%` }}
                title={`${productionStageLabels[stage]}: ${count} talhões`}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {(Object.entries(stats.plotsByStage) as [ProductionStage, number][]).map(([stage, count]) => (
              <div key={stage} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className={cn("w-3 h-3 rounded-full", stageColors[stage])} />
                  <span className="text-sm text-muted-foreground">{productionStageLabels[stage]}</span>
                </div>
                <p className="text-lg font-semibold">{count}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.treesByStage[stage].toLocaleString('pt-BR')} árvores
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
