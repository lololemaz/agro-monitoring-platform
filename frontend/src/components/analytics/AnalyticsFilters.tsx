import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { 
  ProductionStage, 
  productionStageLabels, 
  FruitCaliber, 
  caliberLabels,
  RiskLevel,
  riskLevelLabels 
} from '@/data/analyticsData';
import { mockFarm } from '@/data/mockData';
import { 
  Filter, 
  X, 
  CalendarDays, 
  TreeDeciduous,
  Gauge,
  AlertTriangle,
  MapPin,
  RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface AnalyticsFiltersState {
  search: string;
  productionStages: ProductionStage[];
  calibers: FruitCaliber[];
  riskLevels: RiskLevel[];
  dateRange: { from?: Date; to?: Date };
  harvestWindow: '7d' | '14d' | '30d' | '60d' | 'all';
  yieldRange: { min?: number; max?: number };
}

interface AnalyticsFiltersProps {
  filters: AnalyticsFiltersState;
  onChange: (filters: AnalyticsFiltersState) => void;
  className?: string;
}

const defaultFilters: AnalyticsFiltersState = {
  search: '',
  productionStages: [],
  calibers: [],
  riskLevels: [],
  dateRange: {},
  harvestWindow: 'all',
  yieldRange: {},
};

export function AnalyticsFilters({ filters, onChange, className }: AnalyticsFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const activeFilterCount = 
    (filters.search ? 1 : 0) +
    filters.productionStages.length +
    filters.calibers.length +
    filters.riskLevels.length +
    (filters.dateRange.from || filters.dateRange.to ? 1 : 0) +
    (filters.harvestWindow !== 'all' ? 1 : 0) +
    (filters.yieldRange.min || filters.yieldRange.max ? 1 : 0);

  const toggleStage = (stage: ProductionStage) => {
    const stages = filters.productionStages.includes(stage)
      ? filters.productionStages.filter(s => s !== stage)
      : [...filters.productionStages, stage];
    onChange({ ...filters, productionStages: stages });
  };

  const toggleCaliber = (caliber: FruitCaliber) => {
    const calibers = filters.calibers.includes(caliber)
      ? filters.calibers.filter(c => c !== caliber)
      : [...filters.calibers, caliber];
    onChange({ ...filters, calibers });
  };

  const toggleRisk = (risk: RiskLevel) => {
    const risks = filters.riskLevels.includes(risk)
      ? filters.riskLevels.filter(r => r !== risk)
      : [...filters.riskLevels, risk];
    onChange({ ...filters, riskLevels: risks });
  };

  const resetFilters = () => {
    onChange(defaultFilters);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Quick Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Input
            placeholder="Buscar talhão..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="h-9 pl-9"
          />
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>

        {/* Harvest Window */}
        <Select 
          value={filters.harvestWindow} 
          onValueChange={(v) => onChange({ ...filters, harvestWindow: v as any })}
        >
          <SelectTrigger className="h-9 w-[160px]">
            <CalendarDays className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Janela Colheita" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="7d">Próximos 7 dias</SelectItem>
            <SelectItem value="14d">Próximos 14 dias</SelectItem>
            <SelectItem value="30d">Próximos 30 dias</SelectItem>
            <SelectItem value="60d">Próximos 60 dias</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <CalendarDays className="w-4 h-4 mr-2" />
              {filters.dateRange.from ? (
                filters.dateRange.to ? (
                  <>
                    {format(filters.dateRange.from, 'dd/MM', { locale: ptBR })} -{' '}
                    {format(filters.dateRange.to, 'dd/MM', { locale: ptBR })}
                  </>
                ) : (
                  format(filters.dateRange.from, 'dd/MM/yyyy', { locale: ptBR })
                )
              ) : (
                'Período'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{
                from: filters.dateRange.from,
                to: filters.dateRange.to,
              }}
              onSelect={(range) => 
                onChange({ 
                  ...filters, 
                  dateRange: { from: range?.from, to: range?.to } 
                })
              }
              locale={ptBR}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {/* Advanced Filters Toggle */}
        <Button 
          variant={isOpen ? "default" : "outline"} 
          size="sm" 
          className="h-9"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filtros
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {/* Reset */}
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" className="h-9" onClick={resetFilters}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Limpar
          </Button>
        )}
      </div>

      {/* Extended Filters Panel */}
      {isOpen && (
        <div className="p-4 bg-card border border-border rounded-lg space-y-4 animate-fade-in">
          {/* Production Stages */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2 mb-2">
              <TreeDeciduous className="w-4 h-4" />
              Estágio de Produção
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(productionStageLabels) as [ProductionStage, string][]).map(([stage, label]) => (
                <Badge
                  key={stage}
                  variant={filters.productionStages.includes(stage) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/80 transition-colors"
                  onClick={() => toggleStage(stage)}
                >
                  {label}
                  {filters.productionStages.includes(stage) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Calibers */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2 mb-2">
              <Gauge className="w-4 h-4" />
              Calibre de Frutos
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(caliberLabels) as [FruitCaliber, string][]).map(([caliber, label]) => (
                <Badge
                  key={caliber}
                  variant={filters.calibers.includes(caliber) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/80 transition-colors"
                  onClick={() => toggleCaliber(caliber)}
                >
                  {label}
                  {filters.calibers.includes(caliber) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Risk Levels */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4" />
              Nível de Risco
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(riskLevelLabels) as [RiskLevel, string][]).map(([risk, label]) => (
                <Badge
                  key={risk}
                  variant={filters.riskLevels.includes(risk) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-colors",
                    filters.riskLevels.includes(risk) && risk === 'crítico' && "bg-status-critical",
                    filters.riskLevels.includes(risk) && risk === 'alto' && "bg-status-warning",
                    filters.riskLevels.includes(risk) && risk === 'médio' && "bg-chart-temperature",
                  )}
                  onClick={() => toggleRisk(risk)}
                >
                  {label}
                  {filters.riskLevels.includes(risk) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Yield Range */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
              Faixa de Produtividade (kg)
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Mínimo"
                value={filters.yieldRange.min || ''}
                onChange={(e) => onChange({
                  ...filters,
                  yieldRange: { ...filters.yieldRange, min: e.target.value ? Number(e.target.value) : undefined }
                })}
                className="h-9 w-28"
              />
              <span className="text-muted-foreground">até</span>
              <Input
                type="number"
                placeholder="Máximo"
                value={filters.yieldRange.max || ''}
                onChange={(e) => onChange({
                  ...filters,
                  yieldRange: { ...filters.yieldRange, max: e.target.value ? Number(e.target.value) : undefined }
                })}
                className="h-9 w-28"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { defaultFilters };
