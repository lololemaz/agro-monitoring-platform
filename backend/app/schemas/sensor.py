"""Schemas de sensores."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class SensorResponse(BaseModel):
    """Schema de resposta de sensor."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    farm_id: UUID | None = None
    plot_id: UUID | None = None
    sensor_type_id: UUID
    name: str
    dev_eui: str | None = None
    serial_number: str | None = None
    mac_address: str | None = None
    api_key: str | None = None
    location: dict | None = None
    installation_date: datetime | None = None
    last_signal_at: datetime | None = None
    battery_level: int | None = None
    signal_strength: int | None = None
    is_online: bool = False
    is_active: bool = True
    firmware_version: str | None = None
    configuration: dict = {}
    extra_data: dict = {}
    created_at: datetime
    updated_at: datetime


class SensorCreate(BaseModel):
    """Schema para criacao de sensor."""

    farm_id: UUID | None = None
    plot_id: UUID | None = None
    sensor_type_id: UUID
    name: str
    dev_eui: str | None = None
    serial_number: str | None = None
    mac_address: str | None = None
    location: dict | None = None
    installation_date: datetime | None = None
    firmware_version: str | None = None
    configuration: dict = {}


class SensorUpdate(BaseModel):
    """Schema para atualizacao de sensor."""

    farm_id: UUID | None = None
    plot_id: UUID | None = None
    sensor_type_id: UUID | None = None
    name: str | None = None
    dev_eui: str | None = None
    serial_number: str | None = None
    mac_address: str | None = None
    location: dict | None = None
    installation_date: datetime | None = None
    firmware_version: str | None = None
    configuration: dict | None = None
    is_active: bool | None = None


class SensorHealthIssueResponse(BaseModel):
    """Schema de resposta para sensor com problema de saude."""

    sensor_id: UUID
    sensor_name: str
    plot_id: UUID | None = None
    plot_name: str | None = None
    sensor_type: str
    last_signal_at: datetime | None = None
    battery_level: int | None = None
    signal_strength: int | None = None
    is_online: bool
    issue: str


class SensorHeatmapData(BaseModel):
    """Schema para dados do heatmap por sensor."""

    model_config = ConfigDict(from_attributes=True)

    sensor_id: UUID
    sensor_name: str
    plot_id: UUID | None = None
    plot_name: str | None = None
    location: dict | None = None
    is_online: bool
    last_signal_at: datetime | None = None
    metrics: dict = {}
    is_critical: bool = False
