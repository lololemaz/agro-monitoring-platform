import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { mockFarm, getPlotTimeSeries, SoilReading } from "@/data/mockData";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { KpiCard } from "@/components/ui/KpiCard";
import { MetricChart } from "@/components/MetricChart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  Droplets,
  Thermometer,
  Zap,
  FlaskConical,
  Clock,
  Battery,
  Plus,
  FileText,
  Activity,
  Leaf,
  Target,
  TrendingUp,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type Period = '24h' | '7d' | '30d';
type MetricTab = 'moisture' | 'temperature' | 'ec' | 'nitrogen' | 'phosphorus' | 'potassium';

const periodHours: Record<Period, number> = {
  '24h': 24,
  '7d': 168,
  '30d': 720,
};

interface LocalNote {
  id: string;
  plotId: string;
  text: string;
  timestamp: Date;
}

export default function PlotDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>('24h');
  const [activeMetric, setActiveMetric] = useState<MetricTab>('moisture');
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<LocalNote[]>([]);

  const plot = useMemo(() => {
    return mockFarm.plots.find(p => p.id === id);
  }, [id]);

  const timeSeries = useMemo(() => {
    if (!plot) return [];
    return getPlotTimeSeries(plot.id, periodHours[period]);
  }, [plot, period]);

  const recentReadings = useMemo(() => {
    return timeSeries.slice(-20).reverse();
  }, [timeSeries]);

  if (!plot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Talhão não encontrado</h2>
          <Button onClick={() => navigate('/farm')}>Voltar ao Painel</Button>
        </div>
      </div>
    );
  }

  const { currentSoilReading, currentVisionData, sensors, status, healthScore } = plot;
  const sensor = sensors[0];

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    const newNote: LocalNote = {
      id: Date.now().toString(),
      plotId: plot.id,
      text: noteText.trim(),
      timestamp: new Date(),
    };
    setNotes([newNote, ...notes]);
    setNoteText("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/farm')}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink 
                    href="/farm" 
                    onClick={(e) => { e.preventDefault(); navigate('/farm'); }}
                    className="flex items-center gap-1.5"
                  >
                    <Activity className="w-4 h-4" />
                    Painel
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold">
                    Talhão {plot.name}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="ml-auto flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                healthScore >= 70 ? "bg-status-ok-bg text-status-ok" :
                healthScore >= 50 ? "bg-status-warning-bg text-status-warning" :
                "bg-status-critical-bg text-status-critical"
              )}>
                {healthScore}
              </div>
              <StatusBadge status={status} size="lg" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <KpiCard
            title="Status"
            value={status === 'ok' ? 'Saudável' : status === 'warning' ? 'Atenção' : status === 'critical' ? 'Crítico' : 'Offline'}
            variant={status}
          />
          <KpiCard
            title="Umidade"
            value={`${currentSoilReading.moisture.toFixed(1)}%`}
            icon={Droplets}
          />
          <KpiCard
            title="Temperatura"
            value={`${currentSoilReading.temperature.toFixed(1)}°C`}
            icon={Thermometer}
          />
          <KpiCard
            title="CE"
            value={`${currentSoilReading.ec.toFixed(2)}`}
            subtitle="mS/cm"
            icon={Zap}
          />
          <KpiCard
            title="pH"
            value={currentSoilReading.ph.toFixed(1)}
            icon={Target}
          />
          <KpiCard
            title="NDVI"
            value={currentVisionData.ndvi.toFixed(2)}
            icon={Activity}
          />
          <KpiCard
            title="Clorofila"
            value={`${currentVisionData.chlorophyllLevel.toFixed(0)}%`}
            icon={Leaf}
          />
          <KpiCard
            title="Prod. Estimada"
            value={`${(plot.estimatedYield / 1000).toFixed(1)}t`}
            icon={TrendingUp}
          />
        </div>

        {/* Vision Data Summary */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Contagem de Frutos</span>
            </div>
            <p className="text-2xl font-bold">{Math.round(currentVisionData.fruitCount).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Tamanho médio: {currentVisionData.avgFruitSize.toFixed(0)}mm</p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="w-4 h-4 text-chart-moisture" />
              <span className="text-sm font-medium">Estresse Hídrico</span>
            </div>
            <p className={cn(
              "text-2xl font-bold",
              currentVisionData.waterStressLevel > 60 ? "text-status-critical" :
              currentVisionData.waterStressLevel > 40 ? "text-status-warning" :
              "text-status-ok"
            )}>
              {currentVisionData.waterStressLevel.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">
              {currentVisionData.irrigationFailures > 0 ? `${currentVisionData.irrigationFailures} problemas de irrigação` : 'Nenhum problema detectado'}
            </p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="w-4 h-4 text-chart-nitrogen" />
              <span className="text-sm font-medium">Índice de Maturação</span>
            </div>
            <p className="text-2xl font-bold">{currentVisionData.maturityIndex.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Floração: {currentVisionData.floweringPercentage.toFixed(0)}%</p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-status-warning" />
              <span className="text-sm font-medium">Frutos Caídos</span>
            </div>
            <p className={cn(
              "text-2xl font-bold",
              currentVisionData.fallenFruits > 100 ? "text-status-critical" :
              currentVisionData.fallenFruits > 50 ? "text-status-warning" :
              "text-status-ok"
            )}>
              {currentVisionData.fallenFruits}
            </p>
            <p className="text-xs text-muted-foreground">
              {currentVisionData.pestsDetected ? `⚠️ ${currentVisionData.pestType} detectada` : 'Sem pragas detectadas'}
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="bg-card rounded-lg border p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="font-semibold text-lg">Leituras Históricas</h2>
            <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <TabsList>
                <TabsTrigger value="24h">24h</TabsTrigger>
                <TabsTrigger value="7d">7 dias</TabsTrigger>
                <TabsTrigger value="30d">30 dias</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Tabs value={activeMetric} onValueChange={(v) => setActiveMetric(v as MetricTab)}>
            <TabsList className="w-full md:w-auto flex flex-wrap h-auto gap-1 mb-4 bg-muted/50 p-1">
              <TabsTrigger value="moisture" className="flex items-center gap-1.5">
                <Droplets className="w-4 h-4" />
                <span className="hidden sm:inline">Umidade</span>
              </TabsTrigger>
              <TabsTrigger value="temperature" className="flex items-center gap-1.5">
                <Thermometer className="w-4 h-4" />
                <span className="hidden sm:inline">Temp</span>
              </TabsTrigger>
              <TabsTrigger value="ec" className="flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">CE</span>
              </TabsTrigger>
              <TabsTrigger value="nitrogen" className="flex items-center gap-1.5">
                <span className="font-bold text-chart-nitrogen">N</span>
              </TabsTrigger>
              <TabsTrigger value="phosphorus" className="flex items-center gap-1.5">
                <span className="font-bold text-chart-phosphorus">P</span>
              </TabsTrigger>
              <TabsTrigger value="potassium" className="flex items-center gap-1.5">
                <span className="font-bold text-chart-potassium">K</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="moisture">
              <MetricChart data={timeSeries} metric="moisture" />
            </TabsContent>
            <TabsContent value="temperature">
              <MetricChart data={timeSeries} metric="temperature" />
            </TabsContent>
            <TabsContent value="ec">
              <MetricChart data={timeSeries} metric="ec" />
            </TabsContent>
            <TabsContent value="nitrogen">
              <MetricChart data={timeSeries} metric="nitrogen" />
            </TabsContent>
            <TabsContent value="phosphorus">
              <MetricChart data={timeSeries} metric="phosphorus" />
            </TabsContent>
            <TabsContent value="potassium">
              <MetricChart data={timeSeries} metric="potassium" />
            </TabsContent>
          </Tabs>
        </div>

        {/* Readings Table and Notes */}
        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          {/* Recent Readings Table */}
          <div className="bg-card rounded-lg border p-4 md:p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Leituras Recentes
            </h2>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hora</TableHead>
                    <TableHead className="text-right">Umid.</TableHead>
                    <TableHead className="text-right">Temp.</TableHead>
                    <TableHead className="text-right">CE</TableHead>
                    <TableHead className="text-right">pH</TableHead>
                    <TableHead className="text-right">N</TableHead>
                    <TableHead className="text-right">P</TableHead>
                    <TableHead className="text-right">K</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentReadings.map((reading, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(reading.timestamp, "dd/MM HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {reading.moisture.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {reading.temperature.toFixed(1)}°
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {reading.ec.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {reading.ph.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {reading.nitrogen.toFixed(0)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {reading.phosphorus.toFixed(0)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {reading.potassium.toFixed(0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          {/* Notes Section */}
          <div className="bg-card rounded-lg border p-4 md:p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-muted-foreground" />
              Anotações
            </h2>

            {/* Add note form */}
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Adicionar anotação (ex.: Fertirrigação aplicada 10:30)"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                className="bg-muted/50"
              />
              <Button onClick={handleAddNote} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Notes list */}
            <ScrollArea className="h-[320px]">
              {notes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma anotação ainda</p>
                  <p className="text-xs mt-1">Adicione notas sobre atividades de campo</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm">{note.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(note.timestamp, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Sensor info */}
            {sensor && (
              <div className="mt-4 pt-4 border-t border-border">
                <h3 className="text-sm font-medium mb-2">Sensor</h3>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>
                      Último sinal: {formatDistanceToNow(sensor.lastSignal, { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Battery className="w-4 h-4" />
                    <span>{sensor.batteryLevel.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}