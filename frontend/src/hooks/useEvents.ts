import { useState, useEffect, useCallback } from 'react';
import { eventsService } from '@/services/eventsService';
import { plotsService } from '@/services/plotsService';
import type { Event, EventFilters } from '@/types/event';
import type { Plot } from '@/types/plot';

interface UseEventsResult {
  events: Event[];
  plots: Plot[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createEvent: (data: any) => Promise<Event>;
}

export function useEvents(farmId: string | null, filters?: EventFilters): UseEventsResult {
  const [events, setEvents] = useState<Event[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!farmId) {
      setEvents([]);
      setPlots([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [eventsData, plotsData] = await Promise.all([
        eventsService.getEvents({ farm_id: farmId, ...filters }),
        plotsService.getPlots({ farm_id: farmId }),
      ]);

      setEvents(eventsData);
      setPlots(plotsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar eventos');
    } finally {
      setIsLoading(false);
    }
  }, [farmId, filters?.type, filters?.scope, filters?.start_date, filters?.end_date]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createEvent = async (data: any): Promise<Event> => {
    const newEvent = await eventsService.createEvent(data);
    await loadData();
    return newEvent;
  };

  return {
    events,
    plots,
    isLoading,
    error,
    refresh: loadData,
    createEvent,
  };
}

export const eventTypeConfig: Record<string, { label: string; color: string }> = {
  irrigation: { label: 'Irrigacao', color: '#3b82f6' },
  fertilization: { label: 'Fertilizacao', color: '#22c55e' },
  nutrients: { label: 'Nutrientes', color: '#a855f7' },
  pesticide: { label: 'Defensivo', color: '#ef4444' },
  pruning: { label: 'Poda', color: '#f97316' },
  soil_correction: { label: 'Correcao Solo', color: '#eab308' },
  maintenance: { label: 'Manutencao', color: '#6b7280' },
  harvest: { label: 'Colheita', color: '#10b981' },
  other: { label: 'Outro', color: '#64748b' },
};

export function getEventSummary(event: Event): string {
  if (event.irrigation_data) {
    const data = event.irrigation_data;
    const parts = [];
    if (data.duration_minutes) parts.push(`${data.duration_minutes}min`);
    if (data.water_volume_liters) parts.push(`${data.water_volume_liters}L`);
    return parts.join(' - ') || 'Irrigacao realizada';
  }
  
  if (event.fertilization_data) {
    const data = event.fertilization_data;
    const parts = [];
    if (data.product_name) parts.push(data.product_name);
    if (data.quantity_kg) parts.push(`${data.quantity_kg}kg`);
    return parts.join(' - ') || 'Fertilizacao realizada';
  }
  
  if (event.product_data) {
    const data = event.product_data;
    const parts = [];
    if (data.product_name) parts.push(data.product_name);
    if (data.quantity && data.unit) parts.push(`${data.quantity}${data.unit}`);
    return parts.join(' - ') || 'Aplicacao realizada';
  }
  
  return event.notes || '-';
}
