import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  farmEvents, 
  FarmEvent, 
  EventType, 
  eventTypeConfig,
  getEventSummary
} from '@/data/eventsData';
import { mockFarm } from '@/data/mockData';
import { EventTypeIcon } from '@/components/events/EventTypeIcon';
import { EventDetailSheet } from '@/components/events/EventDetailSheet';
import { EventFormDialog } from '@/components/events/EventFormDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  CalendarIcon, 
  Download, 
  Filter,
  FileText,
  User,
  Bell
} from 'lucide-react';

export default function EventLog() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all');
  const [plotFilter, setPlotFilter] = useState<string>(searchParams.get('plot') || 'all');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  
  const [selectedEvent, setSelectedEvent] = useState<FarmEvent | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const filteredEvents = useMemo(() => {
    return farmEvents.filter(event => {
      // Date filter
      const eventDate = startOfDay(event.timestamp);
      if (eventDate < startOfDay(dateRange.from) || eventDate > endOfDay(dateRange.to)) {
        return false;
      }
      // Type filter
      if (typeFilter !== 'all' && event.type !== typeFilter) return false;
      // Plot filter
      if (plotFilter !== 'all' && event.scopeId !== plotFilter && event.scope !== 'farm') return false;
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          event.title.toLowerCase().includes(searchLower) ||
          event.notes?.toLowerCase().includes(searchLower) ||
          event.productData?.productName?.toLowerCase().includes(searchLower) ||
          event.fertilizationData?.formulation?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [search, typeFilter, plotFilter, dateRange]);

  const handleExportCSV = () => {
    const headers = ['Data', 'Hora', 'Tipo', 'Título', 'Escopo', 'Resumo', 'Operador', 'Notas'];
    const rows = filteredEvents.map(e => [
      format(e.timestamp, 'dd/MM/yyyy'),
      format(e.timestamp, 'HH:mm'),
      eventTypeConfig[e.type].label,
      e.title,
      e.scopeName || '',
      getEventSummary(e),
      e.operator || '',
      e.notes || ''
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eventos-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
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
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Log de Eventos</h1>
                <p className="text-xs text-muted-foreground">Registro de ações operacionais</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Novo Evento
              </Button>
              <Button variant="ghost" size="icon"><Bell className="w-5 h-5" /></Button>
              <Button variant="ghost" size="icon"><User className="w-5 h-5" /></Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 p-4 rounded-lg bg-card border">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar eventos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="w-4 h-4" />
                {format(dateRange.from, 'dd/MM')} - {format(dateRange.to, 'dd/MM')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => range?.from && range?.to && setDateRange({ from: range.from, to: range.to })}
                locale={ptBR}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as EventType | 'all')}>
            <SelectTrigger className="w-[160px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {(Object.keys(eventTypeConfig) as EventType[]).map(type => (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    <EventTypeIcon type={type} size="sm" />
                    {eventTypeConfig[type].label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={plotFilter} onValueChange={setPlotFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Talhão" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {mockFarm.plots.slice(0, 15).map(plot => (
                <SelectItem key={plot.id} value={plot.id}>{plot.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-1" />
            Exportar
          </Button>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          {filteredEvents.length} eventos encontrados
        </p>

        {/* Events Table */}
        <div className="rounded-lg border bg-card">
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Data</TableHead>
                  <TableHead className="w-[60px]">Hora</TableHead>
                  <TableHead className="w-[120px]">Tipo</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Escopo</TableHead>
                  <TableHead>Resumo</TableHead>
                  <TableHead>Operador</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map(event => (
                  <TableRow 
                    key={event.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => { setSelectedEvent(event); setSheetOpen(true); }}
                  >
                    <TableCell className="text-sm">
                      {format(event.timestamp, 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(event.timestamp, 'HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <EventTypeIcon type={event.type} size="sm" showBackground />
                        <span className="text-sm">{eventTypeConfig[event.type].label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {event.scopeName}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {getEventSummary(event)}
                    </TableCell>
                    <TableCell className="text-sm">{event.operator || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </main>

      <EventDetailSheet event={selectedEvent} open={sheetOpen} onOpenChange={setSheetOpen} />
      <EventFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
