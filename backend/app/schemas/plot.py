"""Schemas de talhão."""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PlotBase(BaseModel):
    """Schema base de talhão."""

    name: str
    code: str | None = None
    area: Decimal
    crop_type: str = "Manga - Tommy Atkins"
    variety: str | None = None
    planting_date: date | None = None
    season: str | None = None
    row_count: int = 0
    tree_count: int = 0
    coordinates: dict | None = None
    grid_position: dict | None = None
    extra_data: dict = {}


class PlotCreate(PlotBase):
    """Schema para criação de talhão."""

    farm_id: UUID


class PlotUpdate(BaseModel):
    """Schema para atualização de talhão."""

    name: str | None = None
    code: str | None = None
    area: Decimal | None = None
    crop_type: str | None = None
    variety: str | None = None
    planting_date: date | None = None
    season: str | None = None
    row_count: int | None = None
    tree_count: int | None = None
    coordinates: dict | None = None
    grid_position: dict | None = None
    extra_data: dict | None = None
    is_active: bool | None = None


class PlotResponse(PlotBase):
    """Schema de resposta de talhão."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    farm_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None
    created_by: UUID | None = None
