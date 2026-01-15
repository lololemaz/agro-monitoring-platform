import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useFarm } from "@/contexts/FarmContext";
import { useFarmData } from "@/hooks/useFarmData";
import { KpiCard } from "@/components/ui/KpiCard";
import { PlotCard } from "@/components/PlotCard";
import { AlertsList } from "@/components/AlertsList";
import { SensorHealthList } from "@/components/SensorHealthList";
import { PlotDrawer } from "@/components/PlotDrawer";
import { EventsList } from "@/components/events/EventsList";
import { EventFormDialog } from "@/components/events/EventFormDialog";
import { GlobalFilterBar } from "@/components/filters/GlobalFilterBar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  WifiOff,
  Droplets,
  Thermometer,
  Activity,
  Target,
  LayoutGrid,
  List,
  BarChart3,
  Plus,
  FileText,
  Map as MapIcon,
  RefreshCw
} from "lucide-react";
import type { PlotWithReadings } from "@/types/plot";
import type { Alert } from "@/types/alert";

type Period = '24h' | '7d' | '30d';
type ViewMode = 'grid' | 'list';

export default function Farm() {
  const navigate = useNavigate();
  const { selectedFarm } = useFarm();
  const { 
    plots, 
    alerts, 
    events, 
    sensorIssues, 
    stats, 
    isLoading, 
    isRefreshing,
    refresh 
  } = useFarmData(selectedFarm?.id || null);
  
  const [period, setPeriod] = useState<Period>('24h');
  const [selectedPlot, setSelectedPlot] = useState<PlotWithReadings | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [eventFormOpen, setEventFormOpen] = useState(false);

  const handlePlotClick = (plot: PlotWithReadings) => {
    setSelectedPlot(plot);
    setDrawerOpen(true);
  };

  const handleAlertClick = (alert: Alert) => {
    if (alert.plot_id) {
      navigate(`/plot/${alert.plot_id}`);
    }
  };

  // Farm info
  const farmName = selectedFarm?.name || 'Selecione uma fazenda';
  const farmArea = selectedFarm?.total_area || 0;

  if (!selectedFarm) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Nenhuma fazenda selecionada</h2>
          <p className="text-muted-foreground">
            Selecione uma fazenda no menu lateral para começar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6">
        {/* Page Header with actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-xl leading-tight">{farmName}</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">LIVE</span>
              </div>
              <p className="text-sm text-muted-foreground">{farmArea} ha • {stats.totalPlots} talhões ativos</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={refresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            </Button>
            <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <TabsList className="h-9 bg-muted/50">
                <TabsTrigger value="24h" className="text-xs px-3">24h</TabsTrigger>
                <TabsTrigger value="7d" className="text-xs px-3">7 dias</TabsTrigger>
                <TabsTrigger value="30d" className="text-xs px-3">30 dias</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="default" size="sm" onClick={() => setEventFormOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Evento
            </Button>
          </div>
        </div>

        {/* Global Filter Bar */}
        <GlobalFilterBar className="mb-6" />

        {/* Health Score Banner */}
        <div 
          className="mb-6 p-4 rounded-lg bg-gradient-to-r from-card to-card-elevated border border-border cursor-pointer hover:border-primary/30 transition-all"
          onClick={() => navigate('/analytics')}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {isLoading ? (
                <Skeleton className="w-16 h-16 rounded-full" />
              ) : (
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold",
                  stats.healthScore >= 70 ? "bg-status-ok-bg text-status-ok" :
                  stats.healthScore >= 50 ? "bg-status-warning-bg text-status-warning" :
                  "bg-status-critical-bg text-status-critical"
                )}>
                  {stats.healthScore}
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Pontuação de Saúde da Fazenda</p>
                <p className="text-xl font-semibold">
                  {isLoading ? (
                    <Skeleton className="h-6 w-32" />
                  ) : (
                    stats.healthScore >= 70 ? 'Saudável' : stats.healthScore >= 50 ? 'Atenção Necessária' : 'Problemas Críticos'
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {plots.length} talhões monitorados
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : `${(stats.estimatedYield / 1000).toFixed(0)}t`}
                </p>
                <p className="text-xs text-muted-foreground">Prod. Estimada</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : `${Math.round(stats.totalTrees / 1000)}k`}
                </p>
                <p className="text-xs text-muted-foreground">Árvores</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-status-critical">
                  {isLoading ? <Skeleton className="h-8 w-8" /> : stats.activeAlerts}
                </p>
                <p className="text-xs text-muted-foreground">Alertas Ativos</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={(e) => {
              e.stopPropagation();
              navigate('/heatmap');
            }}>
              <MapIcon className="w-4 h-4" />
              Heatmap
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={(e) => {
              e.stopPropagation();
              navigate('/analytics');
            }}>
              <BarChart3 className="w-4 h-4" />
              Ver Analytics
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          {isLoading ? (
            Array(8).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))
          ) : (
            <>
              <KpiCard title="Talhões OK" value={stats.okCount} icon={CheckCircle2} variant="ok" />
              <KpiCard title="Atenção" value={stats.warningCount} icon={AlertTriangle} variant="warning" />
              <KpiCard title="Críticos" value={stats.criticalCount} icon={XCircle} variant="critical" />
              <KpiCard title="Offline" value={stats.offlineCount} icon={WifiOff} variant="offline" />
              <KpiCard title="Umidade Média" value={`${stats.avgMoisture.toFixed(1)}%`} icon={Droplets} />
              <KpiCard title="Temp Média" value={`${stats.avgTemperature.toFixed(1)}°C`} icon={Thermometer} />
              <KpiCard title="pH Médio" value={stats.avgPh.toFixed(1)} icon={Target} />
              <KpiCard title="Prob. Irrigação" value={stats.irrigationIssues} icon={Droplets} variant={stats.irrigationIssues > 0 ? 'warning' : 'default'} />
            </>
          )}
        </div>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Talhões
                <span className="text-sm text-muted-foreground font-normal">
                  ({plots.length})
                </span>
              </h2>
              <div className="flex items-center gap-2">
                <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('grid')}>
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('list')}>
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className={cn(
                viewMode === 'grid' 
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3"
                  : "flex flex-col gap-2"
              )}>
                {Array(10).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : plots.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Nenhum talhão encontrado</p>
              </div>
            ) : (
              <div className={cn(
                viewMode === 'grid' 
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3"
                  : "flex flex-col gap-2"
              )}>
                {plots.map((plot, index) => (
                  <div key={plot.id} className="animate-fade-in" style={{ animationDelay: `${index * 15}ms` }}>
                    <PlotCard plot={plot} onClick={() => handlePlotClick(plot)} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-card rounded-lg border border-border p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-status-warning" />
                Alertas Ativos
              </h3>
              {isLoading ? (
                <div className="space-y-2">
                  {Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : (
                <AlertsList alerts={alerts} onAlertClick={handleAlertClick} maxHeight="250px" showCategory />
              )}
            </div>

            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Eventos Recentes
                </h3>
                <Button variant="ghost" size="sm" onClick={() => navigate('/events')}>Ver todos</Button>
              </div>
              <EventsList events={events} maxHeight="250px" compact isLoading={isLoading} />
            </div>

            <div className="bg-card rounded-lg border border-border p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <WifiOff className="w-5 h-5 text-status-offline" />
                Saúde dos Sensores
              </h3>
              <SensorHealthList issues={sensorIssues} maxHeight="150px" isLoading={isLoading} />
            </div>
          </div>
        </div>
      </main>

      <PlotDrawer plot={selectedPlot} open={drawerOpen} onOpenChange={setDrawerOpen} />
      <EventFormDialog open={eventFormOpen} onOpenChange={setEventFormOpen} />
    </div>
  );
}
