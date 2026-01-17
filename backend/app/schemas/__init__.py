"""Schemas Pydantic para validacao."""

from app.schemas.alert import (
    AlertAcknowledge,
    AlertCreate,
    AlertResolve,
    AlertResponse,
    AlertUpdate,
)
from app.schemas.analytics import (
    ForecastResponse,
    HistoricalDataPoint,
    HistoricalDataResponse,
    ProductionAnalyticsResponse,
    SnapshotCreate,
    SnapshotResponse,
)
from app.schemas.auth import LoginRequest, PasswordChange, Token, TokenPayload
from app.schemas.event import (
    EventCreate,
    EventResponse,
    EventUpdate,
    FertilizationData,
    IrrigationData,
    ProductData,
)
from app.schemas.farm import FarmBase, FarmCreate, FarmResponse, FarmUpdate
from app.schemas.organization import (
    OrganizationBase,
    OrganizationCreate,
    OrganizationResponse,
    OrganizationUpdate,
    OrganizationWithOwner,
)
from app.schemas.plot import PlotBase, PlotCreate, PlotResponse, PlotUpdate
from app.schemas.sensor import (
    SensorCreate,
    SensorHealthIssueResponse,
    SensorResponse,
    SensorUpdate,
)
from app.schemas.sensor_type import (
    SensorTypeBase,
    SensorTypeCreate,
    SensorTypeResponse,
    SensorTypeUpdate,
)
from app.schemas.timeseries import (
    PlotWithReadingsResponse,
    SoilReadingResponse,
    VisionDataResponse,
)
from app.schemas.user import (
    SuperUserCreate,
    UserBase,
    UserCreate,
    UserResponse,
    UserUpdate,
)

__all__ = [
    # Alert
    "AlertCreate",
    "AlertUpdate",
    "AlertResponse",
    "AlertAcknowledge",
    "AlertResolve",
    # Analytics
    "SnapshotCreate",
    "SnapshotResponse",
    "ProductionAnalyticsResponse",
    "ForecastResponse",
    "HistoricalDataPoint",
    "HistoricalDataResponse",
    # Auth
    "Token",
    "TokenPayload",
    "LoginRequest",
    "PasswordChange",
    # Event
    "EventCreate",
    "EventUpdate",
    "EventResponse",
    "IrrigationData",
    "FertilizationData",
    "ProductData",
    # User
    "UserBase",
    "UserCreate",
    "SuperUserCreate",
    "UserUpdate",
    "UserResponse",
    # Organization
    "OrganizationBase",
    "OrganizationCreate",
    "OrganizationUpdate",
    "OrganizationResponse",
    "OrganizationWithOwner",
    # Farm
    "FarmBase",
    "FarmCreate",
    "FarmUpdate",
    "FarmResponse",
    # Plot
    "PlotBase",
    "PlotCreate",
    "PlotUpdate",
    "PlotResponse",
    # Sensor
    "SensorCreate",
    "SensorUpdate",
    "SensorResponse",
    "SensorHealthIssueResponse",
    # SensorType
    "SensorTypeBase",
    "SensorTypeCreate",
    "SensorTypeUpdate",
    "SensorTypeResponse",
    # TimeSeries
    "SoilReadingResponse",
    "VisionDataResponse",
    "PlotWithReadingsResponse",
]
