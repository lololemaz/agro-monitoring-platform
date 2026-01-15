import { useState } from 'react';
import { useGlobalFilters } from '@/contexts/GlobalFilterContext';
import {
  MangoVariety,
  ProductionStage,
  CriticalityLevel,
  FruitCaliber,
  HarvestWindow,
  IrrigationStatus,
  mangoVarietyConfig,
  productionStageConfig,
  criticalityConfig,
  fruitCaliberConfig,
  harvestWindowConfig,
  irrigationStatusConfig,
  smartFilters,
} from '@/types/filters';
import { mockFarm } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Save,
  RotateCcw,
  Calendar,
  Droplets,
  Leaf,
  Target,
  AlertTriangle,
  TrendingDown,
  Star,
  Eye,
  Info,
  Check,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

interface GlobalFilterBarProps {
  className?: string;
  showSearch?: boolean;
  showSmartFilters?: boolean;
  compact?: boolean;
}

export function GlobalFilterBar({
  className,
  showSearch = true,
  showSmartFilters = true,
  compact = false,
}: GlobalFilterBarProps) {
  const {
    filters,
    updateFilter,
    resetFilters,
    activeSmartFilter,
    applySmartFilter,
    clearSmartFilter,
    savedPresets,
    savePreset,
    loadPreset,
    deletePreset,
    activeFilterCount,
  } = useGlobalFilters();

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState('');

  const iconMap: Record<string, any> = {
    Calendar,
    AlertTriangle,
    TrendingDown,
    Leaf,
    Target,
    Droplets,
    Eye,
    Star,
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    savePreset(presetName.trim());
    setPresetName('');
    setSaveDialogOpen(false);
    toast.success('Preset salvo com sucesso!');
  };

  const toggleArrayFilter = <T extends string>(
    key: keyof typeof filters,
    value: T,
    currentArray: T[]
  ) => {
    const newArray = currentArray.includes(value)
      ? currentArray.filter(v => v !== value)
      : [...currentArray, value];
    updateFilter(key as any, newArray);
  };

  // Calculate affected count (simplified - in real app, this would filter actual data)
  const affectedCount = activeFilterCount > 0 
    ? Math.max(1, Math.floor(mockFarm.plots.length * (1 - activeFilterCount * 0.1)))
    : mockFarm.plots.length;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Main Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-card border border-border">
        {/* Search */}
        {showSearch && (
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar talhões..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        )}

        {/* Variety Filter */}
        <FilterDropdown
          label="Variedade"
          count={filters.varieties.length}
          icon={<Leaf className="w-4 h-4" />}
        >
          <div className="space-y-2 p-2">
            {(Object.keys(mangoVarietyConfig) as MangoVariety[]).map((variety) => (
              <label key={variety} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1.5 rounded">
                <Checkbox
                  checked={filters.varieties.includes(variety)}
                  onCheckedChange={() => toggleArrayFilter('varieties', variety, filters.varieties)}
                />
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: mangoVarietyConfig[variety].color }}
                />
                <span className="text-sm">{mangoVarietyConfig[variety].label}</span>
              </label>
            ))}
          </div>
        </FilterDropdown>

        {/* Production Stage Filter */}
        <FilterDropdown
          label="Estágio"
          count={filters.productionStages.length}
          icon={<Target className="w-4 h-4" />}
        >
          <div className="space-y-2 p-2">
            {(Object.keys(productionStageConfig) as ProductionStage[]).map((stage) => (
              <Tooltip key={stage}>
                <TooltipTrigger asChild>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1.5 rounded">
                    <Checkbox
                      checked={filters.productionStages.includes(stage)}
                      onCheckedChange={() => toggleArrayFilter('productionStages', stage, filters.productionStages)}
                    />
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: productionStageConfig[stage].color }}
                    />
                    <span className="text-sm">{productionStageConfig[stage].label}</span>
                  </label>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="text-xs">{productionStageConfig[stage].description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </FilterDropdown>

        {/* Criticality Filter */}
        <FilterDropdown
          label="Criticidade"
          count={filters.criticalityLevels.length}
          icon={<AlertTriangle className="w-4 h-4" />}
        >
          <div className="space-y-2 p-2">
            {(Object.keys(criticalityConfig) as CriticalityLevel[]).map((level) => (
              <Tooltip key={level}>
                <TooltipTrigger asChild>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1.5 rounded">
                    <Checkbox
                      checked={filters.criticalityLevels.includes(level)}
                      onCheckedChange={() => toggleArrayFilter('criticalityLevels', level, filters.criticalityLevels)}
                    />
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: criticalityConfig[level].color }}
                    />
                    <span className="text-sm">{criticalityConfig[level].label}</span>
                  </label>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="text-xs">{criticalityConfig[level].description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </FilterDropdown>

        {/* Harvest Window Filter */}
        <FilterDropdown
          label="Colheita"
          count={filters.harvestWindow !== 'all' ? 1 : 0}
          icon={<Calendar className="w-4 h-4" />}
        >
          <div className="space-y-1 p-2">
            {(Object.keys(harvestWindowConfig) as HarvestWindow[]).map((window) => (
              <button
                key={window}
                onClick={() => updateFilter('harvestWindow', window)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded text-sm transition-colors",
                  filters.harvestWindow === window
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                {harvestWindowConfig[window].label}
              </button>
            ))}
          </div>
        </FilterDropdown>

        {/* Plot Filter */}
        <FilterDropdown
          label="Talhão"
          count={filters.plots.length}
          icon={<Filter className="w-4 h-4" />}
        >
          <ScrollArea className="h-[250px] p-2">
            <div className="space-y-1">
              {mockFarm.plots.map((plot) => (
                <label key={plot.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1.5 rounded">
                  <Checkbox
                    checked={filters.plots.includes(plot.id)}
                    onCheckedChange={() => toggleArrayFilter('plots', plot.id, filters.plots)}
                  />
                  <span className="text-sm">{plot.name}</span>
                </label>
              ))}
            </div>
          </ScrollArea>
        </FilterDropdown>

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className={cn(advancedOpen && "bg-muted")}
        >
          <Filter className="w-4 h-4 mr-1" />
          Avançado
          {advancedOpen ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
        </Button>

        {/* Filter Actions */}
        <div className="flex items-center gap-1 ml-auto">
          {activeFilterCount > 0 && (
            <>
              <Badge variant="secondary" className="gap-1">
                {activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''}
              </Badge>
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={() => setSaveDialogOpen(true)}>
            <Save className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Smart Filters */}
      {showSmartFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Filtros inteligentes:
          </span>
          {smartFilters.slice(0, 6).map((filter) => {
            const IconComponent = iconMap[filter.icon] || Filter;
            const isActive = activeSmartFilter?.id === filter.id;
            
            return (
              <Tooltip key={filter.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-7 text-xs gap-1",
                      isActive && "ring-2 ring-offset-1"
                    )}
                    style={isActive ? { backgroundColor: filter.color } : undefined}
                    onClick={() => isActive ? clearSmartFilter() : applySmartFilter(filter)}
                  >
                    <IconComponent className="w-3 h-3" />
                    {filter.name}
                    {isActive && <X className="w-3 h-3 ml-1" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{filter.description}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
          
          {/* Saved Presets */}
          {savedPresets.length > 0 && (
            <>
              <Separator orientation="vertical" className="h-5" />
              {savedPresets.slice(0, 3).map((preset) => (
                <Badge
                  key={preset.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted gap-1"
                  onClick={() => loadPreset(preset)}
                >
                  {preset.name}
                  <button
                    onClick={(e) => { e.stopPropagation(); deletePreset(preset.id); }}
                    className="hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </>
          )}
        </div>
      )}

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Filtros ativos:</span>
          
          {filters.varieties.map((v) => (
            <FilterChip
              key={v}
              label={mangoVarietyConfig[v].label}
              onRemove={() => toggleArrayFilter('varieties', v, filters.varieties)}
            />
          ))}
          
          {filters.productionStages.map((s) => (
            <FilterChip
              key={s}
              label={productionStageConfig[s].label}
              onRemove={() => toggleArrayFilter('productionStages', s, filters.productionStages)}
            />
          ))}
          
          {filters.criticalityLevels.map((l) => (
            <FilterChip
              key={l}
              label={criticalityConfig[l].label}
              onRemove={() => toggleArrayFilter('criticalityLevels', l, filters.criticalityLevels)}
            />
          ))}
          
          {filters.harvestWindow !== 'all' && (
            <FilterChip
              label={harvestWindowConfig[filters.harvestWindow].label}
              onRemove={() => updateFilter('harvestWindow', 'all')}
            />
          )}
          
          {filters.search && (
            <FilterChip
              label={`"${filters.search}"`}
              onRemove={() => updateFilter('search', '')}
            />
          )}

          <Separator orientation="vertical" className="h-4" />
          <span className="text-xs text-muted-foreground">
            {affectedCount} de {mockFarm.plots.length} talhões
          </span>
        </div>
      )}

      {/* Advanced Filters Panel */}
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleContent>
          <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Filter className="w-4 h-4" />
              Filtros Avançados
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Caliber */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Calibre do Fruto</Label>
                <div className="space-y-1">
                  {(Object.keys(fruitCaliberConfig) as FruitCaliber[]).map((caliber) => (
                    <label key={caliber} className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox
                        checked={filters.calibers.includes(caliber)}
                        onCheckedChange={() => toggleArrayFilter('calibers', caliber, filters.calibers)}
                      />
                      {fruitCaliberConfig[caliber].label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Irrigation Status */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Status de Irrigação</Label>
                <div className="space-y-1">
                  {(Object.keys(irrigationStatusConfig) as IrrigationStatus[]).map((status) => (
                    <label key={status} className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox
                        checked={filters.irrigationStatus.includes(status)}
                        onCheckedChange={() => toggleArrayFilter('irrigationStatus', status, filters.irrigationStatus)}
                      />
                      {irrigationStatusConfig[status].label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Yield Range */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Produtividade Estimada (kg)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Mín"
                    value={filters.yieldRange.min || ''}
                    onChange={(e) => updateFilter('yieldRange', {
                      ...filters.yieldRange,
                      min: e.target.value ? parseInt(e.target.value) : null
                    })}
                    className="h-8"
                  />
                  <Input
                    type="number"
                    placeholder="Máx"
                    value={filters.yieldRange.max || ''}
                    onChange={(e) => updateFilter('yieldRange', {
                      ...filters.yieldRange,
                      max: e.target.value ? parseInt(e.target.value) : null
                    })}
                    className="h-8"
                  />
                </div>
              </div>

              {/* Moisture Range */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Umidade do Solo (%)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Mín"
                    value={filters.moistureRange.min || ''}
                    onChange={(e) => updateFilter('moistureRange', {
                      ...filters.moistureRange,
                      min: e.target.value ? parseInt(e.target.value) : null
                    })}
                    className="h-8"
                  />
                  <Input
                    type="number"
                    placeholder="Máx"
                    value={filters.moistureRange.max || ''}
                    onChange={(e) => updateFilter('moistureRange', {
                      ...filters.moistureRange,
                      max: e.target.value ? parseInt(e.target.value) : null
                    })}
                    className="h-8"
                  />
                </div>
              </div>

              {/* pH Range */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">pH do Solo</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Mín"
                    value={filters.phRange.min || ''}
                    onChange={(e) => updateFilter('phRange', {
                      ...filters.phRange,
                      min: e.target.value ? parseFloat(e.target.value) : null
                    })}
                    className="h-8"
                  />
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Máx"
                    value={filters.phRange.max || ''}
                    onChange={(e) => updateFilter('phRange', {
                      ...filters.phRange,
                      max: e.target.value ? parseFloat(e.target.value) : null
                    })}
                    className="h-8"
                  />
                </div>
              </div>

              {/* Recent Events */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Eventos Recentes</Label>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <Checkbox
                      checked={filters.hasRecentEvents === true}
                      onCheckedChange={(checked) => updateFilter('hasRecentEvents', checked ? true : null)}
                    />
                    Com eventos recentes
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <Checkbox
                      checked={filters.hasRecentEvents === false}
                      onCheckedChange={(checked) => updateFilter('hasRecentEvents', checked ? false : null)}
                    />
                    Sem eventos recentes
                  </label>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Save Preset Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Salvar Preset de Filtros</DialogTitle>
            <DialogDescription>
              Salve a configuração atual de filtros para uso rápido no futuro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Preset</Label>
              <Input
                placeholder="Ex: Planejamento de colheita semanal"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''} ativo{activeFilterCount > 1 ? 's' : ''}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePreset} disabled={!presetName.trim()}>
              <Save className="w-4 h-4 mr-1" />
              Salvar Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Filter Dropdown Component
interface FilterDropdownProps {
  label: string;
  count: number;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function FilterDropdown({ label, count, icon, children }: FilterDropdownProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5">
          {icon}
          {label}
          {count > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 ml-1">
              {count}
            </Badge>
          )}
          <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        {children}
      </PopoverContent>
    </Popover>
  );
}

// Filter Chip Component
interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <Badge variant="secondary" className="gap-1 pr-1">
      {label}
      <button
        onClick={onRemove}
        className="ml-1 hover:bg-muted rounded-full p-0.5"
      >
        <X className="w-3 h-3" />
      </button>
    </Badge>
  );
}
