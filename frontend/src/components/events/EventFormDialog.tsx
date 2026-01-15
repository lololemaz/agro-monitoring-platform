import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { EventTypeIcon } from './EventTypeIcon';
import { 
  EventType, 
  EventScope, 
  FarmEvent, 
  eventTypeConfig, 
  scopeConfig,
  farmEvents
} from '@/data/eventsData';
import { mockFarm } from '@/data/mockData';
import { CalendarIcon, Plus, Clock, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPlotId?: string;
  defaultDate?: Date;
  onEventCreated?: (event: FarmEvent) => void;
}

const titleSuggestions: Record<EventType, string[]> = {
  irrigation: ['Aumento de irrigação', 'Redução de irrigação', 'Irrigação manual', 'Ajuste de horário'],
  fertilization: ['Aplicação NPK 20-20-10', 'Aplicação NPK 10-10-10', 'Adubação de cobertura', 'Fertirrigação'],
  nutrients: ['Aplicação foliar', 'Micronutrientes', 'Correção de deficiência', 'Quelato de zinco'],
  pesticide: ['Aplicação de fungicida', 'Aplicação de inseticida', 'Controle de pragas', 'Tratamento preventivo'],
  pruning: ['Poda de formação', 'Poda de limpeza', 'Poda de produção', 'Remoção de ramos'],
  soil_correction: ['Aplicação de calcário', 'Gessagem', 'Correção de pH', 'Subsolagem'],
  maintenance: ['Manutenção de irrigação', 'Reparo de equipamento', 'Limpeza de área', 'Substituição de peças'],
  other: ['Visita técnica', 'Coleta de amostras', 'Inspeção geral', 'Registro fotográfico'],
};

export function EventFormDialog({ 
  open, 
  onOpenChange, 
  defaultPlotId,
  defaultDate,
  onEventCreated 
}: EventFormDialogProps) {
  const [eventType, setEventType] = useState<EventType>('irrigation');
  const [scope, setScope] = useState<EventScope>(defaultPlotId ? 'plot' : 'farm');
  const [scopeId, setScopeId] = useState<string>(defaultPlotId || '');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date>(defaultDate || new Date());
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [notes, setNotes] = useState('');
  const [operator, setOperator] = useState('');
  
  // Type-specific fields
  const [durationChange, setDurationChange] = useState('30');
  const [estimatedLiters, setEstimatedLiters] = useState('200');
  const [irrigationMethod, setIrrigationMethod] = useState<'drip' | 'sprinkler' | 'flood' | 'manual'>('drip');
  
  const [formulation, setFormulation] = useState('20-20-10');
  const [dose, setDose] = useState('150');
  const [doseUnit, setDoseUnit] = useState<'kg/ha' | 'g/tree' | 'L/ha'>('kg/ha');
  const [applicationMethod, setApplicationMethod] = useState<'foliar' | 'soil' | 'fertigation' | 'manual'>('fertigation');
  
  const [productName, setProductName] = useState('');
  const [objective, setObjective] = useState('');

  // Recent events for "repeat last"
  const recentEvents = useMemo(() => {
    return farmEvents
      .filter(e => e.type === eventType)
      .slice(0, 3);
  }, [eventType]);

  const handleRepeatLast = (event: FarmEvent) => {
    setTitle(event.title);
    setNotes(event.notes || '');
    if (event.irrigationData) {
      setDurationChange(event.irrigationData.durationChange.toString());
      setEstimatedLiters(event.irrigationData.estimatedLiters.toString());
      setIrrigationMethod(event.irrigationData.method);
    }
    if (event.fertilizationData) {
      setFormulation(event.fertilizationData.formulation);
      setDose(event.fertilizationData.dose.toString());
      setDoseUnit(event.fertilizationData.doseUnit);
      setApplicationMethod(event.fertilizationData.applicationMethod);
    }
    if (event.productData) {
      setProductName(event.productData.productName);
      setDose(event.productData.dose.toString());
      setObjective(event.productData.objective);
    }
    toast.success('Dados do evento anterior carregados');
  };

  const handleSubmit = () => {
    const timestamp = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    timestamp.setHours(hours, minutes, 0, 0);

    const newEvent: FarmEvent = {
      id: `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: eventType,
      scope,
      scopeId: scope !== 'farm' ? scopeId : undefined,
      scopeName: scope !== 'farm' 
        ? mockFarm.plots.find(p => p.id === scopeId)?.name || scopeId
        : 'Toda a Fazenda',
      title: title || titleSuggestions[eventType][0],
      timestamp,
      createdAt: new Date(),
      createdBy: 'Usuário Atual',
      notes: notes || undefined,
      operator: operator || undefined,
      tags: ['standard'],
    };

    // Add type-specific data
    if (eventType === 'irrigation') {
      newEvent.irrigationData = {
        durationChange: parseInt(durationChange) || 0,
        estimatedLiters: parseInt(estimatedLiters) || 0,
        method: irrigationMethod,
      };
    }
    if (eventType === 'fertilization' || eventType === 'soil_correction') {
      newEvent.fertilizationData = {
        formulation,
        dose: parseFloat(dose) || 0,
        doseUnit,
        applicationMethod,
      };
    }
    if (eventType === 'nutrients' || eventType === 'pesticide') {
      newEvent.productData = {
        productName,
        dose: parseFloat(dose) || 0,
        doseUnit: doseUnit,
        objective,
      };
    }

    // Add to mock data (in real app, this would be an API call)
    farmEvents.unshift(newEvent);
    
    toast.success('Evento registrado com sucesso!');
    onEventCreated?.(newEvent);
    onOpenChange(false);
    
    // Reset form
    setTitle('');
    setNotes('');
    setOperator('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Registrar Evento de Campo
          </DialogTitle>
          <DialogDescription>
            Registre ações operacionais realizadas na fazenda
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Event Type */}
          <div className="space-y-2">
            <Label>Tipo de Evento</Label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(eventTypeConfig) as EventType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setEventType(type)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-xs",
                    eventType === type 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <EventTypeIcon type={type} size="md" showBackground />
                  <span className="truncate w-full text-center">
                    {eventTypeConfig[type].label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Repeat Last Event */}
          {recentEvents.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-muted-foreground">
                <Repeat className="w-3 h-3" />
                Repetir evento recente
              </Label>
              <div className="flex flex-wrap gap-2">
                {recentEvents.map((event) => (
                  <Badge
                    key={event.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleRepeatLast(event)}
                  >
                    {event.title}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Scope */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Escopo</Label>
              <Select value={scope} onValueChange={(v) => setScope(v as EventScope)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(scopeConfig) as EventScope[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {scopeConfig[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {scope !== 'farm' && (
              <div className="space-y-2">
                <Label>Talhão</Label>
                <Select value={scopeId} onValueChange={setScopeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mockFarm.plots.map((plot) => (
                      <SelectItem key={plot.id} value={plot.id}>
                        {plot.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(date, "dd/MM/yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={titleSuggestions[eventType][0]}
              list="title-suggestions"
            />
            <datalist id="title-suggestions">
              {titleSuggestions[eventType].map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          </div>

          {/* Type-specific fields */}
          {eventType === 'irrigation' && (
            <div className="space-y-3 p-3 rounded-lg bg-muted/50">
              <p className="text-sm font-medium text-muted-foreground">Dados de Irrigação</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Duração (min)</Label>
                  <Input
                    type="number"
                    value={durationChange}
                    onChange={(e) => setDurationChange(e.target.value)}
                    placeholder="+30"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Litros est.</Label>
                  <Input
                    type="number"
                    value={estimatedLiters}
                    onChange={(e) => setEstimatedLiters(e.target.value)}
                    placeholder="200"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Método</Label>
                  <Select value={irrigationMethod} onValueChange={(v: any) => setIrrigationMethod(v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="drip">Gotejo</SelectItem>
                      <SelectItem value="sprinkler">Aspersão</SelectItem>
                      <SelectItem value="flood">Inundação</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {(eventType === 'fertilization' || eventType === 'soil_correction') && (
            <div className="space-y-3 p-3 rounded-lg bg-muted/50">
              <p className="text-sm font-medium text-muted-foreground">Dados de Fertilização</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Formulação</Label>
                  <Input
                    value={formulation}
                    onChange={(e) => setFormulation(e.target.value)}
                    placeholder="20-20-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Método</Label>
                  <Select value={applicationMethod} onValueChange={(v: any) => setApplicationMethod(v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fertigation">Fertirrigação</SelectItem>
                      <SelectItem value="foliar">Foliar</SelectItem>
                      <SelectItem value="soil">Solo</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Dose</Label>
                  <Input
                    type="number"
                    value={dose}
                    onChange={(e) => setDose(e.target.value)}
                    placeholder="150"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Unidade</Label>
                  <Select value={doseUnit} onValueChange={(v: any) => setDoseUnit(v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg/ha">kg/ha</SelectItem>
                      <SelectItem value="g/tree">g/árvore</SelectItem>
                      <SelectItem value="L/ha">L/ha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {(eventType === 'nutrients' || eventType === 'pesticide') && (
            <div className="space-y-3 p-3 rounded-lg bg-muted/50">
              <p className="text-sm font-medium text-muted-foreground">Dados do Produto</p>
              <div className="space-y-1">
                <Label className="text-xs">Nome do Produto</Label>
                <Input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ex: Mancozeb 800 WP"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Dose</Label>
                  <Input
                    type="number"
                    value={dose}
                    onChange={(e) => setDose(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Unidade</Label>
                  <Select value={doseUnit} onValueChange={(v: any) => setDoseUnit(v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg/ha">kg/ha</SelectItem>
                      <SelectItem value="L/ha">L/ha</SelectItem>
                      <SelectItem value="g/tree">g/árvore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Objetivo</Label>
                <Input
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="Ex: Prevenção de antracnose"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionais sobre o evento..."
              rows={2}
            />
          </div>

          {/* Operator */}
          <div className="space-y-2">
            <Label>Operador / Equipe (opcional)</Label>
            <Input
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              placeholder="Ex: Equipe A, João Silva"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            <Plus className="w-4 h-4 mr-1" />
            Registrar Evento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
