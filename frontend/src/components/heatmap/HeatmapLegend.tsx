import { useMemo } from "react";
import { HeatmapMetricType, metricConfigs } from "@/data/heatmapData";
import { cn } from "@/lib/utils";

interface HeatmapLegendProps {
  metric: HeatmapMetricType;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function HeatmapLegend({ metric, className, orientation = 'vertical' }: HeatmapLegendProps) {
  const config = metricConfigs[metric];
  
  const gradientStyle = useMemo(() => {
    const stops = config.colorScale
      .map((stop, idx) => {
        const percent = (stop.value - config.min) / (config.max - config.min) * 100;
        return `${stop.color} ${percent}%`;
      })
      .join(', ');
    
    return orientation === 'vertical' 
      ? `linear-gradient(to top, ${stops})`
      : `linear-gradient(to right, ${stops})`;
  }, [config, orientation]);

  const labels = useMemo(() => {
    return config.colorScale.map(stop => ({
      value: stop.value,
      label: stop.label,
      percent: (stop.value - config.min) / (config.max - config.min) * 100,
    }));
  }, [config]);

  if (orientation === 'horizontal') {
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
          <span>{config.min}{config.unit}</span>
          <span className="font-medium">{config.label}</span>
          <span>{config.max}{config.unit}</span>
        </div>
        <div 
          className="h-3 w-full rounded-full" 
          style={{ background: gradientStyle }}
        />
        <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
          {labels.slice(0, 4).map((label, idx) => (
            <span key={idx}>{label.label}</span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-2", className)}>
      <div 
        className="w-4 rounded-lg min-h-[120px]" 
        style={{ background: gradientStyle }}
      />
      <div className="flex flex-col justify-between text-[10px] py-0.5">
        {labels.slice().reverse().map((label, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <span className="text-muted-foreground w-10 text-right tabular-nums">
              {label.value}{config.unit}
            </span>
            <span className="text-foreground/80">{label.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
