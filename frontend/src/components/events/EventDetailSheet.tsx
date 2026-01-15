import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { EventTypeIcon, eventTypeConfig, getEventSummary } from './EventTypeIcon';
import type { Event, EventScope } from '@/types/event';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Users, 
  FileText,
  Tag,
  Droplets,
  Leaf,
  FlaskConical
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventDetailSheetProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const scopeConfig: Record<EventScope, { label: string }> = {
  farm: { label: 'Fazenda' },
  plot: { label: 'Talhão' },
  subarea: { label: 'Sub-área' },
  tree_group: { label: 'Grupo de Árvores' },
};

export function EventDetailSheet({ event, open, onOpenChange }: EventDetailSheetProps) {
  if (!event) return null;

  const config = eventTypeConfig[event.type] || eventTypeConfig.other;
  const timestamp = new Date(event.timestamp);
  const createdAt = new Date(event.created_at);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-start gap-3">
            <EventTypeIcon type={event.type} size="lg" showBackground />
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-left">{event.title}</SheetTitle>
              <SheetDescription className="text-left">
                {config.label} • {format(timestamp, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Summary */}
          <div 
            className="p-4 rounded-lg border"
            style={{ backgroundColor: config.bgColor, borderColor: config.color + '30' }}
          >
            <p className="text-sm font-medium" style={{ color: config.color }}>
              {getEventSummary(event)}
            </p>
          </div>

          {/* Basic Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Informações Gerais</h4>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{format(timestamp, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{format(timestamp, "HH:mm")} ({formatDistanceToNow(timestamp, { addSuffix: true, locale: ptBR })})</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{event.scope_name || event.plot_name || scopeConfig[event.scope].label}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Type-specific data */}
          {event.irrigation_data && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Droplets className="w-4 h-4" />
                Dados de Irrigação
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {event.irrigation_data.duration_minutes !== undefined && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Duração</p>
                    <p className="text-lg font-semibold text-chart-moisture">
                      {event.irrigation_data.duration_minutes} min
                    </p>
                  </div>
                )}
                {event.irrigation_data.water_volume_liters !== undefined && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Volume</p>
                    <p className="text-lg font-semibold text-chart-moisture">
                      {event.irrigation_data.water_volume_liters} L
                    </p>
                  </div>
                )}
              </div>
              {event.irrigation_data.method && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Método</p>
                  <p className="font-medium capitalize">{event.irrigation_data.method}</p>
                </div>
              )}
              {event.irrigation_data.notes && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Notas</p>
                  <p className="text-sm">{event.irrigation_data.notes}</p>
                </div>
              )}
            </div>
          )}

          {event.fertilization_data && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Leaf className="w-4 h-4" />
                Dados de Fertilização
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {event.fertilization_data.npk_ratio && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">NPK</p>
                    <p className="text-lg font-semibold text-chart-nitrogen">
                      {event.fertilization_data.npk_ratio}
                    </p>
                  </div>
                )}
                {event.fertilization_data.quantity_kg !== undefined && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Quantidade</p>
                    <p className="text-lg font-semibold">
                      {event.fertilization_data.quantity_kg} kg
                    </p>
                  </div>
                )}
              </div>
              {event.fertilization_data.product_name && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Produto</p>
                  <p className="font-medium">{event.fertilization_data.product_name}</p>
                </div>
              )}
              {event.fertilization_data.application_method && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Método</p>
                  <p className="font-medium capitalize">{event.fertilization_data.application_method}</p>
                </div>
              )}
            </div>
          )}

          {event.product_data && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FlaskConical className="w-4 h-4" />
                Dados do Produto
              </h4>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Produto</p>
                <p className="font-semibold">{event.product_data.product_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {event.product_data.quantity !== undefined && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Quantidade</p>
                    <p className="font-medium">
                      {event.product_data.quantity} {event.product_data.unit || ''}
                    </p>
                  </div>
                )}
                {event.product_data.application_method && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Método</p>
                    <p className="font-medium capitalize">{event.product_data.application_method}</p>
                  </div>
                )}
              </div>
              {event.product_data.active_ingredient && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Ingrediente Ativo</p>
                  <p className="font-medium">{event.product_data.active_ingredient}</p>
                </div>
              )}
              {event.product_data.safety_interval_days !== undefined && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Intervalo de Segurança</p>
                  <p className="font-medium">{event.product_data.safety_interval_days} dias</p>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Notes */}
          {event.notes && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Observações
              </h4>
              <p className="text-sm p-3 rounded-lg bg-muted/50">{event.notes}</p>
            </div>
          )}

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag === 'corrective' ? 'Corretivo' :
                     tag === 'preventive' ? 'Preventivo' :
                     tag === 'experiment' ? 'Experimento' : 'Padrão'}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Audit Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Registro</h4>
            <div className="space-y-2 text-sm">
              {event.created_by && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>Criado por: <strong>{event.created_by}</strong></span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{format(createdAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </div>
              {event.operator && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>Operador: <strong>{event.operator}</strong></span>
                </div>
              )}
              {event.team && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>Equipe: <strong>{event.team}</strong></span>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
