import { useState, useMemo } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EventTypeIcon, eventTypeConfig, getEventSummary } from './EventTypeIcon';
import { EventDetailSheet } from './EventDetailSheet';
import type { Event } from '@/types/event';
import { cn } from '@/lib/utils';
import { ChevronRight, Calendar } from 'lucide-react';

interface EventsListProps {
  events: Event[];
  maxHeight?: string;
  showDate?: boolean;
  compact?: boolean;
  onViewAll?: () => void;
  isLoading?: boolean;
}

export function EventsList({ 
  events, 
  maxHeight = '400px', 
  showDate = true,
  compact = false,
  onViewAll,
  isLoading = false
}: EventsListProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const groupedEvents = useMemo(() => {
    if (!showDate) return { all: events };
    
    const groups: Record<string, Event[]> = {};
    events.forEach(event => {
      const dateKey = format(new Date(event.timestamp), 'yyyy-MM-dd');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(event);
    });
    return groups;
  }, [events, showDate]);

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setSheetOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Nenhum evento registrado</p>
      </div>
    );
  }

  return (
    <>
      <ScrollArea style={{ maxHeight }}>
        <div className="space-y-4">
          {Object.entries(groupedEvents).map(([dateKey, dateEvents]) => (
            <div key={dateKey}>
              {showDate && dateKey !== 'all' && (
                <div className="flex items-center gap-2 mb-2 sticky top-0 bg-background py-1">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground font-medium">
                    {format(new Date(dateKey), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              )}
              
              <div className="space-y-2">
                {dateEvents.map((event) => {
                  const config = eventTypeConfig[event.type] || eventTypeConfig.other;
                  
                  return (
                    <button
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border border-border bg-card transition-all",
                        "hover:border-primary/30 hover:bg-card-elevated",
                        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                        compact && "p-2"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <EventTypeIcon type={event.type} size={compact ? 'sm' : 'md'} showBackground />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={cn("font-medium truncate", compact && "text-sm")}>
                              {event.title}
                            </p>
                            {event.tags?.includes('corrective') && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-status-warning-bg text-status-warning border-status-warning/30">
                                Corretivo
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(event.timestamp), 'HH:mm')} • {event.scope_name || event.plot_name || 'Fazenda'}
                          </p>
                          
                          {!compact && (
                            <p className="text-xs mt-1" style={{ color: config.color }}>
                              {getEventSummary(event)}
                            </p>
                          )}
                        </div>
                        
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {onViewAll && events.length > 0 && (
        <Button 
          variant="ghost" 
          className="w-full mt-3" 
          size="sm"
          onClick={onViewAll}
        >
          Ver todos os eventos
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      )}

      <EventDetailSheet 
        event={selectedEvent} 
        open={sheetOpen} 
        onOpenChange={setSheetOpen} 
      />
    </>
  );
}
