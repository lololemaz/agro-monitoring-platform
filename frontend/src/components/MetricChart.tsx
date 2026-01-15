import { SoilReading, thresholds } from "@/data/mockData";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type MetricKey = 'moisture' | 'temperature' | 'ec' | 'nitrogen' | 'phosphorus' | 'potassium';

interface MetricChartProps {
  data: SoilReading[];
  metric: MetricKey;
  showIdealRange?: boolean;
  className?: string;
}

const metricConfig: Record<MetricKey, {
  label: string;
  unit: string;
  color: string;
  domain?: [number, number];
}> = {
  moisture: { label: 'Umidade', unit: '%', color: 'hsl(var(--chart-moisture))' },
  temperature: { label: 'Temperatura', unit: '°C', color: 'hsl(var(--chart-temperature))' },
  ec: { label: 'EC', unit: 'mS/cm', color: 'hsl(var(--chart-ec))' },
  nitrogen: { label: 'Nitrogênio (N)', unit: 'ppm', color: 'hsl(var(--chart-nitrogen))' },
  phosphorus: { label: 'Fósforo (P)', unit: 'ppm', color: 'hsl(var(--chart-phosphorus))' },
  potassium: { label: 'Potássio (K)', unit: 'ppm', color: 'hsl(var(--chart-potassium))' },
};

export function MetricChart({ data, metric, showIdealRange = true, className }: MetricChartProps) {
  const config = metricConfig[metric];
  const threshold = thresholds[metric];

  const chartData = data.map(reading => ({
    time: reading.timestamp.getTime(),
    value: reading[metric],
    label: format(reading.timestamp, 'HH:mm', { locale: ptBR }),
  }));

  const values = chartData.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const padding = (maxValue - minValue) * 0.1 || 5;

  return (
    <div className={cn("w-full h-[250px]", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
          
          {showIdealRange && (
            <ReferenceArea
              y1={threshold.okMin}
              y2={threshold.okMax}
              fill="hsl(var(--status-ok))"
              fillOpacity={0.1}
              stroke="none"
            />
          )}

          <XAxis
            dataKey="time"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(value) => format(new Date(value), 'HH:mm')}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          
          <YAxis
            domain={[minValue - padding, maxValue + padding]}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            width={40}
            tickFormatter={(value) => value.toFixed(metric === 'ec' ? 1 : 0)}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius)',
              fontSize: 12,
            }}
            formatter={(value: number) => [
              `${value.toFixed(metric === 'ec' ? 2 : 1)} ${config.unit}`,
              config.label
            ]}
            labelFormatter={(value) => format(new Date(value), "dd/MM HH:mm", { locale: ptBR })}
          />

          {showIdealRange && (
            <>
              <ReferenceLine
                y={threshold.okMin}
                stroke="hsl(var(--status-ok))"
                strokeDasharray="5 5"
                strokeOpacity={0.5}
              />
              <ReferenceLine
                y={threshold.okMax}
                stroke="hsl(var(--status-ok))"
                strokeDasharray="5 5"
                strokeOpacity={0.5}
              />
            </>
          )}

          <Line
            type="monotone"
            dataKey="value"
            stroke={config.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: config.color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
