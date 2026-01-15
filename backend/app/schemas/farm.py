"""Schemas de fazenda."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class FarmBase(BaseModel):
    """Schema base de fazenda."""

    name: str
    code: str | None = None
    total_area: Decimal | None = None
    address: str | None = None
    coordinates: dict | None = None
    timezone: str = "America/Sao_Paulo"
    settings: dict = {}


class FarmCreate(FarmBase):
    """Schema para criação de fazenda."""

    organization_id: UUID | None = None  # Opcional, usa org do usuário se não informado


class FarmUpdate(BaseModel):
    """Schema para atualização de fazenda."""

    name: str | None = None
    code: str | None = None
    total_area: Decimal | None = None
    address: str | None = None
    coordinates: dict | None = None
    timezone: str | None = None
    settings: dict | None = None
    is_active: bool | None = None


class FarmResponse(FarmBase):
    """Schema de resposta de fazenda."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None
    created_by: UUID | None = None
