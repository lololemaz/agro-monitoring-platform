import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { EventTypeIcon } from './EventTypeIcon';
import { EventDetailSheet } from './EventDetailSheet';
import { FarmEvent, eventTypeConfig, getEventSummary } from '@/data/eventsData';
import { cn } from '@/lib/utils';

interface EventMarkerProps {
  event: FarmEvent;
  size?: 'sm' | 'md';
  className?: string;
}

export function EventMarker({ event, size = 'sm', className }: EventMarkerProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const config = eventTypeConfig[event.type];

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setSheetOpen(true)}
            className={cn(
              "relative cursor-pointer transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
              "rounded-full flex items-center justify-center",
              size === 'sm' ? "w-4 h-4" : "w-6 h-6",
              className
            )}
            style={{ 
              backgroundColor: config.bgColor,
              border: `2px solid ${config.color}`,
            }}
          >
            <EventTypeIcon type={event.type} size="sm" />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs p-3"
          style={{ borderColor: config.color + '30' }}
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <EventTypeIcon type={event.type} size="sm" />
              <span className="font-medium text-sm">{event.title}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {format(event.timestamp, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
            <p className="text-xs" style={{ color: config.color }}>
              {getEventSummary(event)}
            </p>
            {event.notes && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {event.notes}
              </p>
            )}
            <p className="text-xs text-primary mt-1">Clique para detalhes →</p>
          </div>
        </TooltipContent>
      </Tooltip>

      <EventDetailSheet 
        event={event} 
        open={sheetOpen} 
        onOpenChange={setSheetOpen} 
      />
    </>
  );
}
