"""Schemas de analytics."""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class SnapshotBase(BaseModel):
    """Schema base de snapshot de producao."""

    plot_id: UUID
    snapshot_date: date
    status: str = "ok"
    health_score: Decimal | None = None
    production_stage: str | None = None
    flowers_per_tree: Decimal | None = None
    total_flowers: int | None = None
    flowering_percentage: Decimal | None = None
    fruits_per_tree: Decimal | None = None
    total_fruits: int | None = None
    avg_fruit_size: Decimal | None = None
    fruit_caliber: str | None = None
    estimated_yield_kg: Decimal | None = None
    estimated_yield_tons: Decimal | None = None
    harvest_start_date: date | None = None
    harvest_end_date: date | None = None
    days_to_harvest: int | None = None
    risk_level: str | None = None
    risk_factors: list[str] = []
    extra_data: dict = {}


class SnapshotCreate(SnapshotBase):
    """Schema para criacao de snapshot."""

    last_soil_reading_id: UUID | None = None
    last_vision_data_id: UUID | None = None


class SnapshotResponse(SnapshotBase):
    """Schema de resposta de snapshot."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    last_soil_reading_id: UUID | None = None
    last_vision_data_id: UUID | None = None
    created_at: datetime
    plot_name: str | None = None
    plot_code: str | None = None


class ProductionAnalyticsResponse(BaseModel):
    """Schema de resposta de analytics de producao."""

    total_plots: int
    plots_with_data: int
    total_fruits: int
    estimated_yield_kg: float
    estimated_yield_tons: float
    status_summary: dict[str, int]
    snapshots: list[dict]


class ForecastResponse(BaseModel):
    """Schema de resposta de previsao de producao."""

    total_estimated_kg: float
    total_estimated_tons: float
    harvest_start: date | None = None
    harvest_end: date | None = None
    plots_ready: int
    plots_in_progress: int


class HistoricalDataPoint(BaseModel):
    """Ponto de dados historicos."""

    date: str
    value: float


class HistoricalDataResponse(BaseModel):
    """Schema de resposta de dados historicos."""

    metric: str
    period: str
    data: list[HistoricalDataPoint]
