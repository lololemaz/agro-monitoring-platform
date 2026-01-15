import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { farmTrees, HeatmapMetricType, TreeData, metricConfigs } from "@/data/heatmapData";
import { HeatmapCanvas } from "@/components/heatmap/HeatmapCanvas";
import { HeatmapLegend } from "@/components/heatmap/HeatmapLegend";
import { HeatmapFilters } from "@/components/heatmap/HeatmapFilters";
import { HeatmapStats } from "@/components/heatmap/HeatmapStats";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ArrowLeft, 
  Map, 
  Layers, 
  Download, 
  Maximize2,
  TreeDeciduous,
  Activity
} from "lucide-react";
import { mockFarm } from "@/data/mockData";

export default function Heatmap() {
  const navigate = useNavigate();
  
  const [selectedMetric, setSelectedMetric] = useState<HeatmapMetricType>('soilMoisture');
  const [selectedPlotId, setSelectedPlotId] = useState<string | undefined>();
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [showOutliers, setShowOutliers] = useState(false);
  const [selectedTree, setSelectedTree] = useState<TreeData | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  const filteredTrees = useMemo(() => {
    let result = farmTrees;
    if (selectedPlotId) {
      result = result.filter(t => t.plotId === selectedPlotId);
    }
    if (showCriticalOnly) {
      result = result.filter(t => t.isCritical);
    }
    return result;
  }, [selectedPlotId, showCriticalOnly]);

  const handleTreeClick = (tree: TreeData) => {
    setSelectedTree(tree);
    setDetailSheetOpen(true);
  };

  const handleReset = () => {
    setSelectedMetric('soilMoisture');
    setSelectedPlotId(undefined);
    setShowCriticalOnly(false);
    setShowOutliers(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/farm')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
                <Map className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-lg leading-tight">Heatmap Espacial</h1>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">LIVE</span>
                </div>
                <p className="text-xs text-muted-foreground">{mockFarm.name} • {farmTrees.length.toLocaleString()} árvores</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button variant="outline" size="icon">
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        <aside className="w-72 border-r border-border bg-card/50 p-4 hidden lg:flex flex-col gap-6 overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Filtros</h2>
            </div>
            <HeatmapFilters
              trees={farmTrees}
              selectedMetric={selectedMetric}
              onMetricChange={setSelectedMetric}
              selectedPlotId={selectedPlotId}
              onPlotChange={setSelectedPlotId}
              showCriticalOnly={showCriticalOnly}
              onShowCriticalOnlyChange={setShowCriticalOnly}
              showOutliers={showOutliers}
              onShowOutliersChange={setShowOutliers}
              onReset={handleReset}
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Legenda</h2>
            </div>
            <HeatmapLegend metric={selectedMetric} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TreeDeciduous className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Estatísticas</h2>
            </div>
            <HeatmapStats trees={filteredTrees} metric={selectedMetric} />
          </div>
        </aside>

        <main className="flex-1 relative">
          <HeatmapCanvas
            trees={farmTrees}
            metric={selectedMetric}
            showCriticalOnly={showCriticalOnly}
            showOutliers={showOutliers}
            selectedPlotId={selectedPlotId}
            onTreeClick={handleTreeClick}
            className="absolute inset-0"
          />
          <div className="absolute top-3 right-3 lg:hidden bg-card/90 backdrop-blur-sm rounded-lg p-3 border border-border">
            <HeatmapLegend metric={selectedMetric} orientation="horizontal" />
          </div>
        </main>
      </div>

      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent className="w-[400px] sm:max-w-[400px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <TreeDeciduous className="w-5 h-5 text-primary" />
              {selectedTree?.id}
            </SheetTitle>
          </SheetHeader>
          
          {selectedTree && (
            <div className="mt-6 space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Informações</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Talhão</p>
                    <p className="font-medium">{selectedTree.plotName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Variedade</p>
                    <p className="font-medium">{selectedTree.variety}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Posição</p>
                    <p className="font-medium">Linha {selectedTree.row + 1}, Col {selectedTree.col + 1}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Atualizado</p>
                    <p className="font-medium">{format(selectedTree.lastUpdate, "dd/MM HH:mm", { locale: ptBR })}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Métricas</h3>
                <div className="space-y-2">
                  {Object.entries(selectedTree.metrics).map(([key, value]) => {
                    const metricKey = key as HeatmapMetricType;
                    const config = metricConfigs[metricKey];
                    const isOptimal = value >= config.optimalMin && value <= config.optimalMax;
                    
                    return (
                      <div key={key} className="flex items-center justify-between py-2 border-b border-border/50">
                        <span className="text-sm">{config.label}</span>
                        <span className={`font-medium tabular-nums ${isOptimal ? 'text-status-ok' : 'text-status-warning'}`}>
                          {value.toFixed(1)}{config.unit}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => navigate(`/plot/${selectedTree.plotId}`)}>
                  Ver Talhão
                </Button>
                <Button className="flex-1">Criar Evento</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
