import { useState, useMemo } from 'react';
import { PlotProduction, productionStageLabels, caliberLabels, riskLevelLabels } from '@/data/analyticsData';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Download,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProductionTableProps {
  data: PlotProduction[];
  onRowClick?: (plot: PlotProduction) => void;
  className?: string;
}

type SortField = 'plotName' | 'area' | 'treeCount' | 'productionStage' | 'healthScore' | 
                 'flowersPerTree' | 'fruitsPerTree' | 'estimatedYieldKg' | 'daysToHarvest' | 'riskLevel';
type SortDirection = 'asc' | 'desc';

export function ProductionTable({ data, onRowClick, className }: ProductionTableProps) {
  const [sortField, setSortField] = useState<SortField>('plotName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'plotName':
          comparison = a.plotName.localeCompare(b.plotName);
          break;
        case 'area':
          comparison = a.area - b.area;
          break;
        case 'treeCount':
          comparison = a.treeCount - b.treeCount;
          break;
        case 'productionStage':
          const stageOrder = ['floração', 'frutificação', 'crescimento', 'maturação', 'pronto_colheita'];
          comparison = stageOrder.indexOf(a.productionStage) - stageOrder.indexOf(b.productionStage);
          break;
        case 'healthScore':
          comparison = a.healthScore - b.healthScore;
          break;
        case 'flowersPerTree':
          comparison = a.flowersPerTree - b.flowersPerTree;
          break;
        case 'fruitsPerTree':
          comparison = a.fruitsPerTree - b.fruitsPerTree;
          break;
        case 'estimatedYieldKg':
          comparison = a.estimatedYieldKg - b.estimatedYieldKg;
          break;
        case 'daysToHarvest':
          comparison = a.daysToHarvest - b.daysToHarvest;
          break;
        case 'riskLevel':
          const riskOrder = ['baixo', 'médio', 'alto', 'crítico'];
          comparison = riskOrder.indexOf(a.riskLevel) - riskOrder.indexOf(b.riskLevel);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 ml-1" />
      : <ArrowDown className="w-4 h-4 ml-1" />;
  };

  const exportToCSV = () => {
    const headers = [
      'Talhão', 'Área (ha)', 'Árvores', 'Estágio', 'Saúde (%)', 
      'Flores/Árv', 'Frutos/Árv', 'Total Frutos', 'Calibre Médio (g)',
      'Prod. Est. (kg)', 'Prod. Est. (t)', 'Início Colheita', 'Fim Colheita',
      'Dias p/ Colheita', 'Risco'
    ];
    
    const rows = sortedData.map(p => [
      p.plotName,
      p.area,
      p.treeCount,
      productionStageLabels[p.productionStage],
      p.healthScore,
      p.flowersPerTree,
      p.fruitsPerTree,
      p.totalFruits,
      p.avgFruitSize.toFixed(0),
      p.estimatedYieldKg,
      p.estimatedYieldTons.toFixed(2),
      format(p.harvestStartDate, 'dd/MM/yyyy'),
      format(p.harvestEndDate, 'dd/MM/yyyy'),
      p.daysToHarvest,
      riskLevelLabels[p.riskLevel]
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `producao_talhoes_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const getHealthColor = (score: number) => {
    if (score >= 70) return 'text-status-ok';
    if (score >= 50) return 'text-status-warning';
    return 'text-status-critical';
  };

  const getRiskBadgeVariant = (risk: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (risk) {
      case 'crítico': return 'destructive';
      case 'alto': return 'destructive';
      case 'médio': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className={cn("bg-card border border-border rounded-lg", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h3 className="font-semibold">Detalhamento por Talhão</h3>
          <p className="text-xs text-muted-foreground">{data.length} talhões</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportToCSV}>
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">
                <button 
                  className="flex items-center font-semibold hover:text-foreground transition-colors"
                  onClick={() => handleSort('plotName')}
                >
                  Talhão
                  <SortIcon field="plotName" />
                </button>
              </TableHead>
              <TableHead>
                <button 
                  className="flex items-center font-semibold hover:text-foreground transition-colors"
                  onClick={() => handleSort('area')}
                >
                  Área
                  <SortIcon field="area" />
                </button>
              </TableHead>
              <TableHead>
                <button 
                  className="flex items-center font-semibold hover:text-foreground transition-colors"
                  onClick={() => handleSort('treeCount')}
                >
                  Árvores
                  <SortIcon field="treeCount" />
                </button>
              </TableHead>
              <TableHead>
                <button 
                  className="flex items-center font-semibold hover:text-foreground transition-colors"
                  onClick={() => handleSort('productionStage')}
                >
                  Estágio
                  <SortIcon field="productionStage" />
                </button>
              </TableHead>
              <TableHead>
                <button 
                  className="flex items-center font-semibold hover:text-foreground transition-colors"
                  onClick={() => handleSort('healthScore')}
                >
                  Saúde
                  <SortIcon field="healthScore" />
                </button>
              </TableHead>
              <TableHead>
                <button 
                  className="flex items-center font-semibold hover:text-foreground transition-colors"
                  onClick={() => handleSort('flowersPerTree')}
                >
                  Flores/Árv
                  <SortIcon field="flowersPerTree" />
                </button>
              </TableHead>
              <TableHead>
                <button 
                  className="flex items-center font-semibold hover:text-foreground transition-colors"
                  onClick={() => handleSort('fruitsPerTree')}
                >
                  Frutos/Árv
                  <SortIcon field="fruitsPerTree" />
                </button>
              </TableHead>
              <TableHead>
                <button 
                  className="flex items-center font-semibold hover:text-foreground transition-colors"
                  onClick={() => handleSort('estimatedYieldKg')}
                >
                  Prod. Est.
                  <SortIcon field="estimatedYieldKg" />
                </button>
              </TableHead>
              <TableHead>
                <button 
                  className="flex items-center font-semibold hover:text-foreground transition-colors"
                  onClick={() => handleSort('daysToHarvest')}
                >
                  Colheita
                  <SortIcon field="daysToHarvest" />
                </button>
              </TableHead>
              <TableHead>
                <button 
                  className="flex items-center font-semibold hover:text-foreground transition-colors"
                  onClick={() => handleSort('riskLevel')}
                >
                  Risco
                  <SortIcon field="riskLevel" />
                </button>
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map(plot => (
              <TableRow 
                key={plot.plotId}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onRowClick?.(plot)}
              >
                <TableCell className="font-medium">{plot.plotName}</TableCell>
                <TableCell>{plot.area} ha</TableCell>
                <TableCell>{plot.treeCount.toLocaleString('pt-BR')}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {productionStageLabels[plot.productionStage]}
                  </Badge>
                </TableCell>
                <TableCell className={cn("font-medium", getHealthColor(plot.healthScore))}>
                  {plot.healthScore}%
                </TableCell>
                <TableCell>{plot.flowersPerTree}</TableCell>
                <TableCell>{plot.fruitsPerTree}</TableCell>
                <TableCell className="font-medium">
                  {plot.estimatedYieldTons.toFixed(1)}t
                </TableCell>
                <TableCell>
                  <div>
                    <span className="font-medium">{plot.daysToHarvest}d</span>
                    <p className="text-xs text-muted-foreground">
                      {format(plot.harvestStartDate, 'dd/MM', { locale: ptBR })}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getRiskBadgeVariant(plot.riskLevel)}>
                    {riskLevelLabels[plot.riskLevel]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
