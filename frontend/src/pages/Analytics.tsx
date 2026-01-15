import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  plotProductions, 
  harvestForecasts, 
  productionTimeSeries,
  farmProductionStats,
  PlotProduction
} from '@/data/analyticsData';
import { mockFarm } from '@/data/mockData';
import { AnalyticsFilters, AnalyticsFiltersState, defaultFilters } from '@/components/analytics/AnalyticsFilters';
import { FarmSummaryCards } from '@/components/analytics/FarmSummaryCards';
import { ProductionHeatmap } from '@/components/analytics/ProductionHeatmap';
import { PlotProductionCard } from '@/components/analytics/PlotProductionCard';
import { ProductionTable } from '@/components/analytics/ProductionTable';
import { ForecastCharts } from '@/components/analytics/ForecastCharts';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, 
  Activity, 
  Map, 
  LayoutGrid, 
  Table,
  BarChart3,
  User,
  Bell
} from 'lucide-react';

type ViewMode = 'heatmap' | 'cards' | 'table';

export default function Analytics() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('heatmap');
  const [filters, setFilters] = useState<AnalyticsFiltersState>(() => {
    const stage = searchParams.get('stage');
    const harvestWindow = searchParams.get('harvest');
    return {
      ...defaultFilters,
      productionStages: stage ? [stage as any] : [],
      harvestWindow: (harvestWindow as any) || 'all',
    };
  });

  const filteredData = useMemo(() => {
    return plotProductions.filter(plot => {
      if (filters.search && !plot.plotName.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.productionStages.length > 0 && !filters.productionStages.includes(plot.productionStage)) {
        return false;
      }
      if (filters.calibers.length > 0 && !filters.calibers.includes(plot.fruitCaliber)) {
        return false;
      }
      if (filters.riskLevels.length > 0 && !filters.riskLevels.includes(plot.riskLevel)) {
        return false;
      }
      if (filters.harvestWindow !== 'all') {
        const days = parseInt(filters.harvestWindow);
        if (plot.daysToHarvest > days) return false;
      }
      if (filters.yieldRange.min && plot.estimatedYieldKg < filters.yieldRange.min) {
        return false;
      }
      if (filters.yieldRange.max && plot.estimatedYieldKg > filters.yieldRange.max) {
        return false;
      }
      return true;
    });
  }, [filters]);

  const handlePlotClick = (plot: PlotProduction) => {
    navigate(`/plot/${plot.plotId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
                <h1 className="font-bold text-lg">Analytics de Produção</h1>
                <p className="text-xs text-muted-foreground">{mockFarm.name} • Inteligência Agrícola</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon"><Bell className="w-5 h-5" /></Button>
              <Button variant="ghost" size="icon"><User className="w-5 h-5" /></Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <FarmSummaryCards stats={farmProductionStats} />

        {/* Filters */}
        <AnalyticsFilters filters={filters} onChange={setFilters} />

        {/* View Mode Tabs */}
        <div className="flex items-center justify-between">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="heatmap" className="gap-2">
                <Map className="w-4 h-4" />
                Mapa de Calor
              </TabsTrigger>
              <TabsTrigger value="cards" className="gap-2">
                <LayoutGrid className="w-4 h-4" />
                Widgets
              </TabsTrigger>
              <TabsTrigger value="table" className="gap-2">
                <Table className="w-4 h-4" />
                Tabela
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-sm text-muted-foreground">
            {filteredData.length} de {plotProductions.length} talhões
          </p>
        </div>

        {/* Visualization */}
        {viewMode === 'heatmap' && (
          <ProductionHeatmap data={filteredData} onPlotClick={handlePlotClick} />
        )}

        {viewMode === 'cards' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredData.map(plot => (
              <PlotProductionCard key={plot.plotId} plot={plot} onClick={() => handlePlotClick(plot)} />
            ))}
          </div>
        )}

        {viewMode === 'table' && (
          <ProductionTable data={filteredData} onRowClick={handlePlotClick} />
        )}

        {/* Forecast Charts */}
        <ForecastCharts harvestData={harvestForecasts} timeSeriesData={productionTimeSeries} />
      </main>
    </div>
  );
}
