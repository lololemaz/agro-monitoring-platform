"""Schemas de tipo de sensor."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class SensorTypeBase(BaseModel):
    """Schema base de tipo de sensor."""

    name: str
    slug: str
    category: str
    description: str | None = None
    manufacturer: str | None = None
    model: str | None = None
    specifications: dict = {}
    supported_metrics: list[str] = []
    payload_schema: dict | None = None


class SensorTypeCreate(SensorTypeBase):
    """Schema para criação de tipo de sensor."""

    pass


class SensorTypeUpdate(BaseModel):
    """Schema para atualização de tipo de sensor."""

    name: str | None = None
    slug: str | None = None
    category: str | None = None
    description: str | None = None
    manufacturer: str | None = None
    model: str | None = None
    specifications: dict | None = None
    supported_metrics: list[str] | None = None
    payload_schema: dict | None = None
    is_active: bool | None = None


class SensorTypeResponse(SensorTypeBase):
    """Schema de resposta de tipo de sensor."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
