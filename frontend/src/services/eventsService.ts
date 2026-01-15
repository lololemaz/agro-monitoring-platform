import api from './api';
import type { 
  Event, 
  EventCreate, 
  EventUpdate,
  EventFilters,
  EventAttachment 
} from '@/types/event';

/**
 * Events service - CRUD operations for events
 */
export const eventsService = {
  /**
   * Get all events, optionally filtered
   */
  async getEvents(filters?: EventFilters): Promise<Event[]> {
    const response = await api.get<Event[]>('/events/', { params: filters });
    return response.data;
  },

  /**
   * Get events for a specific farm
   */
  async getFarmEvents(farmId: string, limit?: number): Promise<Event[]> {
    return this.getEvents({ 
      farm_id: farmId,
      ...(limit && { limit }),
    } as EventFilters & { limit?: number });
  },

  /**
   * Get events for a specific plot
   */
  async getPlotEvents(plotId: string): Promise<Event[]> {
    return this.getEvents({ plot_id: plotId });
  },

  /**
   * Get recent events
   */
  async getRecentEvents(farmId: string, limit = 10): Promise<Event[]> {
    const response = await api.get<Event[]>('/events/', {
      params: {
        farm_id: farmId,
        limit,
        sort_by: 'timestamp',
        sort_order: 'desc',
      },
    });
    return response.data;
  },

  /**
   * Get event by ID
   */
  async getEvent(id: string): Promise<Event> {
    const response = await api.get<Event>(`/events/${id}`);
    return response.data;
  },

  /**
   * Create new event
   */
  async createEvent(data: EventCreate): Promise<Event> {
    const response = await api.post<Event>('/events/', data);
    return response.data;
  },

  /**
   * Update event
   */
  async updateEvent(id: string, data: EventUpdate): Promise<Event> {
    const response = await api.put<Event>(`/events/${id}`, data);
    return response.data;
  },

  /**
   * Delete event (soft delete)
   */
  async deleteEvent(id: string): Promise<void> {
    await api.delete(`/events/${id}`);
  },

  // ==========================================
  // Attachments
  // ==========================================

  /**
   * Get attachments for an event
   */
  async getEventAttachments(eventId: string): Promise<EventAttachment[]> {
    const response = await api.get<EventAttachment[]>(`/events/${eventId}/attachments`);
    return response.data;
  },

  /**
   * Upload attachment to event
   */
  async uploadAttachment(
    eventId: string, 
    file: File, 
    type: 'photo' | 'document' | 'invoice'
  ): Promise<EventAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    const response = await api.post<EventAttachment>(
      `/events/${eventId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Delete attachment
   */
  async deleteAttachment(eventId: string, attachmentId: string): Promise<void> {
    await api.delete(`/events/${eventId}/attachments/${attachmentId}`);
  },
};

export default eventsService;
