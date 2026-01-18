import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePlotDetail } from "@/hooks/usePlotDetail";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { KpiCard } from "@/components/ui/KpiCard";
import { MetricChart } from "@/components/MetricChart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
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
  Clock,
  Battery,
  Plus,
  FileText,
  Activity,
  Leaf,
  Target,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type MetricTab = 'moisture' | 'temperature' | 'ec' | 'nitrogen' | 'phosphorus' | 'potassium';

interface LocalNote {
  id: string;
  plotId: string;
  text: string;
  timestamp: Date;
}

export default function PlotDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { plot, soilReadings, visionData, sensors, isLoading, refresh } = usePlotDetail(id);
  
  const [activeMetric, setActiveMetric] = useState<MetricTab>('moisture');
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<LocalNote[]>([]);

  const chartData = useMemo(() => {
    return soilReadings.map(reading => ({
      timestamp: new Date(reading.time),
      moisture: reading.moisture ?? 0,
      temperature: reading.temperature ?? 0,
      ec: reading.ec ?? 0,
      ph: reading.ph ?? 0,
      nitrogen: reading.nitrogen ?? 0,
      phosphorus: reading.phosphorus ?? 0,
      potassium: reading.potassium ?? 0,
    })).reverse();
  }, [soilReadings]);

  const recentReadings = useMemo(() => {
    return soilReadings.slice(0, 20);
  }, [soilReadings]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 bg-card border-b border-border">
          <div className="container mx-auto px-4 py-3">
            <Skeleton className="h-10 w-64" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {Array(8).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <Skeleton className="h-[400px]" />
        </main>
      </div>
    );
  }

  if (!plot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Talhao nao encontrado</h2>
          <Button onClick={() => navigate('/farm')}>Voltar ao Painel</Button>
        </div>
      </div>
    );
  }

  const currentSoil = plot.current_soil_reading;
  const currentVision = plot.current_vision_data;
  const sensor = sensors[0];
  const status = plot.status || 'offline';
  const healthScore = plot.health_score || 0;

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
                    Talhao {plot.name}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="ml-auto flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={refresh}>
                <RefreshCw className="w-4 h-4" />
              </Button>
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <KpiCard
            title="Status"
            value={status === 'ok' ? 'Saudavel' : status === 'warning' ? 'Atencao' : status === 'critical' ? 'Critico' : 'Offline'}
            variant={status}
          />
          <KpiCard
            title="Umidade"
            value={currentSoil?.moisture != null ? `${Number(currentSoil.moisture).toFixed(1)}%` : '-'}
            icon={Droplets}
          />
          <KpiCard
            title="Temperatura"
            value={currentSoil?.temperature != null ? `${Number(currentSoil.temperature).toFixed(1)}C` : '-'}
            icon={Thermometer}
          />
          <KpiCard
            title="CE"
            value={currentSoil?.ec != null ? `${Number(currentSoil.ec).toFixed(2)}` : '-'}
            subtitle="mS/cm"
            icon={Zap}
          />
          <KpiCard
            title="pH"
            value={currentSoil?.ph != null ? Number(currentSoil.ph).toFixed(1) : '-'}
            icon={Target}
          />
          <KpiCard
            title="NDVI"
            value={currentVision?.ndvi != null ? Number(currentVision.ndvi).toFixed(2) : '-'}
            icon={Activity}
          />
          <KpiCard
            title="Clorofila"
            value={currentVision?.chlorophyll_level != null ? `${Number(currentVision.chlorophyll_level).toFixed(0)}%` : '-'}
            icon={Leaf}
          />
          <KpiCard
            title="Prod. Estimada"
            value={plot.estimated_yield ? `${(Number(plot.estimated_yield) / 1000).toFixed(1)}t` : '-'}
            icon={TrendingUp}
          />
        </div>

        {currentVision && (
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-card rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Contagem de Frutos</span>
              </div>
              <p className="text-2xl font-bold">{(currentVision.fruit_count || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">
                Tamanho medio: {currentVision.avg_fruit_size != null ? Number(currentVision.avg_fruit_size).toFixed(0) : '-'}mm
              </p>
            </div>
            <div className="bg-card rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="w-4 h-4 text-chart-moisture" />
                <span className="text-sm font-medium">Estresse Hidrico</span>
              </div>
              <p className={cn(
                "text-2xl font-bold",
                Number(currentVision.water_stress_level ?? 0) > 60 ? "text-status-critical" :
                Number(currentVision.water_stress_level ?? 0) > 40 ? "text-status-warning" :
                "text-status-ok"
              )}>
                {currentVision.water_stress_level != null ? Number(currentVision.water_stress_level).toFixed(0) : 0}%
              </p>
              <p className="text-xs text-muted-foreground">
                {currentVision.irrigation_failures > 0 
                  ? `${currentVision.irrigation_failures} problemas de irrigacao` 
                  : 'Nenhum problema detectado'}
              </p>
            </div>
            <div className="bg-card rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="w-4 h-4 text-chart-nitrogen" />
                <span className="text-sm font-medium">Indice de Maturacao</span>
              </div>
              <p className="text-2xl font-bold">{currentVision.maturity_index != null ? Number(currentVision.maturity_index).toFixed(0) : '-'}%</p>
              <p className="text-xs text-muted-foreground">
                Floracao: {currentVision.flowering_percentage != null ? Number(currentVision.flowering_percentage).toFixed(0) : '-'}%
              </p>
            </div>
            <div className="bg-card rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-status-warning" />
                <span className="text-sm font-medium">Frutos Caidos</span>
              </div>
              <p className={cn(
                "text-2xl font-bold",
                currentVision.fallen_fruits > 100 ? "text-status-critical" :
                currentVision.fallen_fruits > 50 ? "text-status-warning" :
                "text-status-ok"
              )}>
                {currentVision.fallen_fruits}
              </p>
              <p className="text-xs text-muted-foreground">
                {currentVision.pests_detected 
                  ? `Praga: ${currentVision.pest_type || 'detectada'}` 
                  : 'Sem pragas detectadas'}
              </p>
            </div>
          </div>
        )}

        {chartData.length > 0 && (
          <div className="bg-card rounded-lg border p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h2 className="font-semibold text-lg">Leituras Historicas</h2>
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
                <MetricChart data={chartData} metric="moisture" />
              </TabsContent>
              <TabsContent value="temperature">
                <MetricChart data={chartData} metric="temperature" />
              </TabsContent>
              <TabsContent value="ec">
                <MetricChart data={chartData} metric="ec" />
              </TabsContent>
              <TabsContent value="nitrogen">
                <MetricChart data={chartData} metric="nitrogen" />
              </TabsContent>
              <TabsContent value="phosphorus">
                <MetricChart data={chartData} metric="phosphorus" />
              </TabsContent>
              <TabsContent value="potassium">
                <MetricChart data={chartData} metric="potassium" />
              </TabsContent>
            </Tabs>
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          <div className="bg-card rounded-lg border p-4 md:p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Leituras Recentes
            </h2>
            <ScrollArea className="h-[400px]">
              {recentReadings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma leitura disponivel</p>
                </div>
              ) : (
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
                          {format(new Date(reading.time), "dd/MM HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {reading.moisture != null ? `${Number(reading.moisture).toFixed(1)}%` : '-'}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {reading.temperature != null ? Number(reading.temperature).toFixed(1) : '-'}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {reading.ec != null ? Number(reading.ec).toFixed(2) : '-'}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {reading.ph != null ? Number(reading.ph).toFixed(1) : '-'}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {reading.nitrogen != null ? Number(reading.nitrogen).toFixed(0) : '-'}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {reading.phosphorus != null ? Number(reading.phosphorus).toFixed(0) : '-'}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {reading.potassium != null ? Number(reading.potassium).toFixed(0) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </div>

          <div className="bg-card rounded-lg border p-4 md:p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-muted-foreground" />
              Anotacoes
            </h2>

            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Adicionar anotacao (ex.: Fertirrigacao aplicada 10:30)"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                className="bg-muted/50"
              />
              <Button onClick={handleAddNote} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <ScrollArea className="h-[320px]">
              {notes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma anotacao ainda</p>
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

            {sensor && (
              <div className="mt-4 pt-4 border-t border-border">
                <h3 className="text-sm font-medium mb-2">Sensor</h3>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>
                      Ultimo sinal: {sensor.last_signal_at 
                        ? formatDistanceToNow(new Date(sensor.last_signal_at), { addSuffix: true, locale: ptBR })
                        : 'Nunca'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Battery className="w-4 h-4" />
                    <span>{sensor.battery_level ?? '-'}%</span>
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
