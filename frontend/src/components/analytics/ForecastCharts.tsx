import { useMemo } from 'react';
import { 
  HarvestForecast, 
  ProductionTimeSeries,
  caliberLabels 
} from '@/data/analyticsData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
  ReferenceLine
} from 'recharts';
import { cn } from '@/lib/utils';
import { TrendingUp, Calendar, Apple, Flower2 } from 'lucide-react';

interface ForecastChartsProps {
  harvestData: HarvestForecast[];
  timeSeriesData: ProductionTimeSeries[];
  className?: string;
}

export function ForecastCharts({ harvestData, timeSeriesData, className }: ForecastChartsProps) {
  const harvestChartData = useMemo(() => {
    return harvestData.map(h => ({
      ...h,
      label: h.weekLabel,
      yieldTons: h.expectedYieldTons,
      pequeno: h.calibers.pequeno / 1000,
      médio: h.calibers.médio / 1000,
      grande: h.calibers.grande / 1000,
      extra_grande: h.calibers.extra_grande / 1000,
    }));
  }, [harvestData]);

  const timeSeriesChartData = useMemo(() => {
    return timeSeriesData.map(t => ({
      ...t,
      flores: t.totalFlowers / 1000000,
      frutos: t.totalFruits / 1000000,
      rendimento: t.yieldTons,
    }));
  }, [timeSeriesData]);

  const todayIndex = useMemo(() => {
    const today = new Date().toDateString();
    return timeSeriesData.findIndex(t => t.date.toDateString() === today);
  }, [timeSeriesData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">
              {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      <Tabs defaultValue="yield" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="yield" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Evolução de Produção
            </TabsTrigger>
            <TabsTrigger value="harvest" className="gap-2">
              <Calendar className="w-4 h-4" />
              Previsão de Colheita
            </TabsTrigger>
            <TabsTrigger value="conversion" className="gap-2">
              <Flower2 className="w-4 h-4" />
              Conversão Flor → Fruto
            </TabsTrigger>
            <TabsTrigger value="caliber" className="gap-2">
              <Apple className="w-4 h-4" />
              Distribuição por Calibre
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Yield Evolution */}
        <TabsContent value="yield">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">
                Evolução da Produtividade ao Longo do Tempo
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Histórico de 30 dias + previsão para próximos 30 dias
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeSeriesChartData}>
                    <defs>
                      <linearGradient id="yieldGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                      label={{ value: 'Toneladas', angle: -90, position: 'insideLeft', fontSize: 11 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {todayIndex >= 0 && (
                      <ReferenceLine 
                        x={timeSeriesChartData[todayIndex]?.label} 
                        stroke="hsl(var(--accent))" 
                        strokeDasharray="5 5"
                        label={{ value: 'Hoje', position: 'top', fontSize: 11 }}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="rendimento"
                      name="Rendimento (t)"
                      stroke="hsl(var(--primary))"
                      fill="url(#yieldGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Harvest Forecast */}
        <TabsContent value="harvest">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">
                Volume Esperado de Colheita por Semana
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Previsão para as próximas 12 semanas
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={harvestChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                      label={{ value: 'Toneladas', angle: -90, position: 'insideLeft', fontSize: 11 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar 
                      dataKey="yieldTons" 
                      name="Produção (t)"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flower to Fruit Conversion */}
        <TabsContent value="conversion">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">
                Tendência de Conversão Flor → Fruto
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Acompanhamento do ciclo produtivo
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis 
                      yAxisId="left"
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                      label={{ value: 'Milhões', angle: -90, position: 'insideLeft', fontSize: 11 }}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                      domain={[0, 100]}
                      label={{ value: 'Taxa (%)', angle: 90, position: 'insideRight', fontSize: 11 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {todayIndex >= 0 && (
                      <ReferenceLine 
                        x={timeSeriesChartData[todayIndex]?.label} 
                        stroke="hsl(var(--accent))" 
                        strokeDasharray="5 5"
                        yAxisId="left"
                      />
                    )}
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="flores"
                      name="Flores (M)"
                      stroke="hsl(300, 70%, 60%)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="frutos"
                      name="Frutos (M)"
                      stroke="hsl(25, 85%, 55%)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="conversionRate"
                      name="Taxa Conversão (%)"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Caliber Distribution */}
        <TabsContent value="caliber">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">
                Distribuição por Calibre ao Longo do Tempo
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Previsão de colheita segmentada por tamanho de fruto
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={harvestChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                      label={{ value: 'Milhares de frutos', angle: -90, position: 'insideLeft', fontSize: 11 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar 
                      dataKey="pequeno" 
                      name="Pequeno"
                      stackId="caliber"
                      fill="hsl(200, 70%, 50%)"
                    />
                    <Bar 
                      dataKey="médio" 
                      name="Médio"
                      stackId="caliber"
                      fill="hsl(152, 65%, 45%)"
                    />
                    <Bar 
                      dataKey="grande" 
                      name="Grande"
                      stackId="caliber"
                      fill="hsl(45, 85%, 55%)"
                    />
                    <Bar 
                      dataKey="extra_grande" 
                      name="Extra Grande"
                      stackId="caliber"
                      fill="hsl(25, 85%, 55%)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
