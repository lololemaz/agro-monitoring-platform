"""Schemas de eventos."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class IrrigationData(BaseModel):
    """Dados de irrigacao."""

    duration_minutes: int | None = None
    water_volume_liters: float | None = None
    method: str | None = None
    notes: str | None = None


class FertilizationData(BaseModel):
    """Dados de fertilizacao."""

    product_name: str | None = None
    quantity_kg: float | None = None
    application_method: str | None = None
    npk_ratio: str | None = None
    notes: str | None = None


class ProductData(BaseModel):
    """Dados de produto aplicado."""

    product_name: str | None = None
    active_ingredient: str | None = None
    quantity: float | None = None
    unit: str | None = None
    application_method: str | None = None
    safety_interval_days: int | None = None
    notes: str | None = None


class EventBase(BaseModel):
    """Schema base de evento."""

    farm_id: UUID | None = None
    plot_id: UUID | None = None
    row_id: UUID | None = None
    type: str
    scope: str
    scope_id: UUID | None = None
    scope_name: str | None = None
    title: str
    timestamp: datetime
    irrigation_data: IrrigationData | None = None
    fertilization_data: FertilizationData | None = None
    product_data: ProductData | None = None
    notes: str | None = None
    operator: str | None = None
    team: str | None = None
    tags: list[str] = []


class EventCreate(EventBase):
    """Schema para criacao de evento."""

    pass


class EventUpdate(BaseModel):
    """Schema para atualizacao de evento."""

    type: str | None = None
    scope: str | None = None
    scope_id: UUID | None = None
    scope_name: str | None = None
    title: str | None = None
    timestamp: datetime | None = None
    irrigation_data: IrrigationData | None = None
    fertilization_data: FertilizationData | None = None
    product_data: ProductData | None = None
    notes: str | None = None
    operator: str | None = None
    team: str | None = None
    tags: list[str] | None = None


class EventResponse(EventBase):
    """Schema de resposta de evento."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    created_by: UUID | None = None
    updated_by: UUID | None = None
    created_at: datetime
    updated_at: datetime


class EventAttachmentResponse(BaseModel):
    """Schema de resposta de anexo de evento."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    event_id: UUID
    name: str
    type: str
    url: str
    file_size: int | None = None
    mime_type: str | None = None
    uploaded_by: UUID | None = None
    created_at: datetime
