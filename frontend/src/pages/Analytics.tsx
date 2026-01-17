import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFarm } from '@/contexts/FarmContext';
import { useAnalytics, PlotProduction } from '@/hooks/useAnalytics';
import { FarmSummaryCards } from '@/components/analytics/FarmSummaryCards';
import { ProductionHeatmap } from '@/components/analytics/ProductionHeatmap';
import { PlotProductionCard } from '@/components/analytics/PlotProductionCard';
import { ProductionTable } from '@/components/analytics/ProductionTable';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Map, 
  LayoutGrid, 
  Table,
  BarChart3,
  RefreshCw,
  Search,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewMode = 'heatmap' | 'cards' | 'table';

export default function Analytics() {
  const navigate = useNavigate();
  const { selectedFarm } = useFarm();
  const { plotProductions, farmStats, farmSummary, isLoading, refresh } = useAnalytics(selectedFarm?.id || null);
  
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredData = useMemo(() => {
    if (!searchTerm) return plotProductions;
    const term = searchTerm.toLowerCase();
    return plotProductions.filter(plot => 
      plot.plotName.toLowerCase().includes(term) ||
      (plot.plotCode && plot.plotCode.toLowerCase().includes(term))
    );
  }, [plotProductions, searchTerm]);

  const handlePlotClick = (plot: PlotProduction) => {
    navigate(`/plot/${plot.plotId}`);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  if (!selectedFarm) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Nenhuma fazenda selecionada</h2>
          <p className="text-muted-foreground">
            Selecione uma fazenda no menu lateral para ver analytics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/farm')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
                <BarChart3 className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Analytics de Producao</h1>
                <p className="text-xs text-muted-foreground">{selectedFarm.name}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {isLoading ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <Skeleton className="h-12" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Total Talhoes</p>
                <p className="text-2xl font-bold">{farmStats.totalPlots}</p>
              </div>
              <div className="bg-card rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Producao Estimada</p>
                <p className="text-2xl font-bold">{farmStats.totalEstimatedYieldTons.toFixed(1)}t</p>
              </div>
              <div className="bg-card rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Total Frutos</p>
                <p className="text-2xl font-bold">{farmStats.totalFruits.toLocaleString()}</p>
              </div>
              <div className="bg-card rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Saude Media</p>
                <p className={cn(
                  "text-2xl font-bold",
                  farmStats.avgHealthScore >= 70 ? "text-status-ok" :
                  farmStats.avgHealthScore >= 50 ? "text-status-warning" :
                  "text-status-critical"
                )}>
                  {farmStats.avgHealthScore.toFixed(0)}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar talhao..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                <TabsList>
                  <TabsTrigger value="cards" className="gap-2">
                    <LayoutGrid className="w-4 h-4" />
                    Cards
                  </TabsTrigger>
                  <TabsTrigger value="table" className="gap-2">
                    <Table className="w-4 h-4" />
                    Tabela
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <p className="text-sm text-muted-foreground">
                {filteredData.length} de {plotProductions.length} talhoes
              </p>
            </div>

            {filteredData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Nenhum dado de producao disponivel</p>
                <p className="text-sm mt-1">Crie snapshots de producao para visualizar analytics</p>
              </div>
            ) : viewMode === 'cards' ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredData.map(plot => (
                  <PlotProductionCard key={plot.plotId} plot={plot} onClick={() => handlePlotClick(plot)} />
                ))}
              </div>
            ) : (
              <ProductionTable data={filteredData} onRowClick={handlePlotClick} />
            )}

            {farmStats.plotsByStage && Object.keys(farmStats.plotsByStage).length > 0 && (
              <div className="bg-card rounded-lg border p-4">
                <h3 className="font-semibold mb-4">Distribuicao por Estagio</h3>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(farmStats.plotsByStage).map(([stage, count]) => (
                    <div key={stage} className="bg-muted/50 rounded-lg px-4 py-2">
                      <p className="text-sm text-muted-foreground capitalize">{stage.replace('_', ' ')}</p>
                      <p className="text-xl font-bold">{count}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
