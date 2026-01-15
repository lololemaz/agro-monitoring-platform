import { useMemo } from "react";
import { TreeData, HeatmapMetricType, metricConfigs, getTreeStats } from "@/data/heatmapData";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";

interface HeatmapStatsProps {
  trees: TreeData[];
  metric: HeatmapMetricType;
  className?: string;
}

export function HeatmapStats({ trees, metric, className }: HeatmapStatsProps) {
  const config = metricConfigs[metric];
  const stats = useMemo(() => getTreeStats(trees, metric), [trees, metric]);

  const optimalPercentage = (stats.optimalCount / stats.total) * 100;
  const criticalPercentage = (stats.criticalCount / stats.total) * 100;

  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {/* Average */}
      <div className="bg-card/50 rounded-lg p-3 border border-border">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Média</p>
        <p className="text-xl font-bold tabular-nums">
          {stats.avg.toFixed(1)}<span className="text-sm text-muted-foreground ml-0.5">{config.unit}</span>
        </p>
      </div>

      {/* Range */}
      <div className="bg-card/50 rounded-lg p-3 border border-border">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Variação</p>
        <p className="text-sm font-medium tabular-nums">
          {stats.min.toFixed(1)} - {stats.max.toFixed(1)}<span className="text-muted-foreground ml-0.5">{config.unit}</span>
        </p>
      </div>

      {/* Optimal */}
      <div className="bg-status-ok-bg/50 rounded-lg p-3 border border-status-ok-border/30">
        <div className="flex items-center gap-1.5 mb-1">
          <CheckCircle2 className="w-3 h-3 text-status-ok" />
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Na faixa ideal</p>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-xl font-bold text-status-ok tabular-nums">{stats.optimalCount.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">({optimalPercentage.toFixed(0)}%)</p>
        </div>
      </div>

      {/* Critical */}
      <div className="bg-status-critical-bg/50 rounded-lg p-3 border border-status-critical-border/30">
        <div className="flex items-center gap-1.5 mb-1">
          <AlertTriangle className="w-3 h-3 text-status-critical" />
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Atenção</p>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-xl font-bold text-status-critical tabular-nums">{stats.criticalCount.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">({criticalPercentage.toFixed(0)}%)</p>
        </div>
      </div>
    </div>
  );
}
