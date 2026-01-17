import { useState, useMemo } from 'react';
import { PlotProduction } from '@/hooks/useAnalytics';
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

type SortField = 'plotName' | 'productionStage' | 'healthScore' | 'totalFruits' | 'estimatedYieldKg' | 'daysToHarvest' | 'riskLevel';
type SortDirection = 'asc' | 'desc';

const stageLabels: Record<string, string> = {
  'floracao': 'Floracao',
  'frutificacao': 'Frutificacao',
  'crescimento': 'Crescimento',
  'maturacao': 'Maturacao',
  'pronto_colheita': 'Pronto Colheita',
};

const riskLabels: Record<string, string> = {
  'baixo': 'Baixo',
  'medio': 'Medio',
  'alto': 'Alto',
  'critico': 'Critico',
};

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
        case 'productionStage':
          const stageOrder = ['floracao', 'frutificacao', 'crescimento', 'maturacao', 'pronto_colheita'];
          comparison = stageOrder.indexOf(a.productionStage || '') - stageOrder.indexOf(b.productionStage || '');
          break;
        case 'healthScore':
          comparison = a.healthScore - b.healthScore;
          break;
        case 'totalFruits':
          comparison = a.totalFruits - b.totalFruits;
          break;
        case 'estimatedYieldKg':
          comparison = a.estimatedYieldKg - b.estimatedYieldKg;
          break;
        case 'daysToHarvest':
          comparison = (a.daysToHarvest ?? 999) - (b.daysToHarvest ?? 999);
          break;
        case 'riskLevel':
          const riskOrder = ['baixo', 'medio', 'alto', 'critico'];
          comparison = riskOrder.indexOf(a.riskLevel || 'baixo') - riskOrder.indexOf(b.riskLevel || 'baixo');
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
      'Talhao', 'Estagio', 'Saude (%)', 'Total Frutos',
      'Prod. Est. (kg)', 'Prod. Est. (t)', 'Dias p/ Colheita', 'Risco'
    ];
    
    const rows = sortedData.map(p => [
      p.plotName,
      p.productionStage ? stageLabels[p.productionStage] || p.productionStage : '-',
      p.healthScore,
      p.totalFruits,
      p.estimatedYieldKg,
      p.estimatedYieldTons.toFixed(2),
      p.daysToHarvest ?? '-',
      p.riskLevel ? riskLabels[p.riskLevel] || p.riskLevel : '-'
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

  const getRiskBadgeVariant = (risk: string | null): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (risk) {
      case 'critico': return 'destructive';
      case 'alto': return 'destructive';
      case 'medio': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className={cn("bg-card border border-border rounded-lg", className)}>
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h3 className="font-semibold">Detalhamento por Talhao</h3>
          <p className="text-xs text-muted-foreground">{data.length} talhoes</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportToCSV}>
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">
                <button 
                  className="flex items-center font-semibold hover:text-foreground transition-colors"
                  onClick={() => handleSort('plotName')}
                >
                  Talhao
                  <SortIcon field="plotName" />
                </button>
              </TableHead>
              <TableHead>
                <button 
                  className="flex items-center font-semibold hover:text-foreground transition-colors"
                  onClick={() => handleSort('productionStage')}
                >
                  Estagio
                  <SortIcon field="productionStage" />
                </button>
              </TableHead>
              <TableHead>
                <button 
                  className="flex items-center font-semibold hover:text-foreground transition-colors"
                  onClick={() => handleSort('healthScore')}
                >
                  Saude
                  <SortIcon field="healthScore" />
                </button>
              </TableHead>
              <TableHead>
                <button 
                  className="flex items-center font-semibold hover:text-foreground transition-colors"
                  onClick={() => handleSort('totalFruits')}
                >
                  Frutos
                  <SortIcon field="totalFruits" />
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
                <TableCell>
                  {plot.productionStage ? (
                    <Badge variant="outline" className="text-xs">
                      {stageLabels[plot.productionStage] || plot.productionStage}
                    </Badge>
                  ) : '-'}
                </TableCell>
                <TableCell className={cn("font-medium", getHealthColor(plot.healthScore))}>
                  {plot.healthScore}%
                </TableCell>
                <TableCell>{plot.totalFruits.toLocaleString('pt-BR')}</TableCell>
                <TableCell className="font-medium">
                  {plot.estimatedYieldTons.toFixed(1)}t
                </TableCell>
                <TableCell>
                  {plot.daysToHarvest !== null ? (
                    <div>
                      <span className="font-medium">{plot.daysToHarvest}d</span>
                      {plot.harvestStartDate && (
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(plot.harvestStartDate), 'dd/MM', { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  {plot.riskLevel ? (
                    <Badge variant={getRiskBadgeVariant(plot.riskLevel)}>
                      {riskLabels[plot.riskLevel] || plot.riskLevel}
                    </Badge>
                  ) : '-'}
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
