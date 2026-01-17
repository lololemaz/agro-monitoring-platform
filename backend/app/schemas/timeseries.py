"""Schemas para dados de time-series."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class SoilReadingResponse(BaseModel):
    """Schema de resposta para leitura de solo."""

    model_config = ConfigDict(from_attributes=True)

    time: datetime
    sensor_id: UUID
    plot_id: UUID
    moisture: Decimal | None = None
    temperature: Decimal | None = None
    ec: Decimal | None = None
    ph: Decimal | None = None
    nitrogen: Decimal | None = None
    phosphorus: Decimal | None = None
    potassium: Decimal | None = None
    extra_data: dict = {}


class VisionDataResponse(BaseModel):
    """Schema de resposta para dados de visao computacional."""

    model_config = ConfigDict(from_attributes=True)

    time: datetime
    sensor_id: UUID
    plot_id: UUID
    irrigation_failures: int = 0
    water_stress_level: Decimal | None = None
    over_irrigation_detected: bool = False
    blocked_lines: int = 0
    fruit_count: int = 0
    avg_fruit_size: Decimal | None = None
    flowering_percentage: Decimal | None = None
    pests_detected: bool = False
    pest_type: str | None = None
    fallen_fruits: int = 0
    chlorophyll_level: Decimal | None = None
    ndvi: Decimal | None = None
    vegetative_stress: Decimal | None = None
    maturity_index: Decimal | None = None
    image_urls: list[str] = []
    extra_data: dict = {}


class PlotWithReadingsResponse(BaseModel):
    """Schema de resposta para talhao com leituras atuais."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    farm_id: UUID
    name: str
    code: str | None = None
    area: Decimal
    crop_type: str
    variety: str | None = None
    planting_date: datetime | None = None
    season: str | None = None
    row_count: int = 0
    tree_count: int = 0
    coordinates: dict | None = None
    grid_position: dict | None = None
    extra_data: dict = {}
    is_active: bool
    created_at: datetime
    updated_at: datetime
    status: str | None = None
    health_score: int | None = None
    current_soil_reading: SoilReadingResponse | None = None
    current_vision_data: VisionDataResponse | None = None
    sensors_count: int = 0
    estimated_yield: Decimal | None = None
