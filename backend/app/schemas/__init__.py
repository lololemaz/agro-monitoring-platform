"""Schemas Pydantic para validação."""

from app.schemas.auth import LoginRequest, PasswordChange, Token, TokenPayload
from app.schemas.farm import FarmBase, FarmCreate, FarmResponse, FarmUpdate
from app.schemas.organization import (
    OrganizationBase,
    OrganizationCreate,
    OrganizationResponse,
    OrganizationUpdate,
    OrganizationWithOwner,
)
from app.schemas.plot import PlotBase, PlotCreate, PlotResponse, PlotUpdate
from app.schemas.sensor_type import (
    SensorTypeBase,
    SensorTypeCreate,
    SensorTypeResponse,
    SensorTypeUpdate,
)
from app.schemas.user import (
    SuperUserCreate,
    UserBase,
    UserCreate,
    UserResponse,
    UserUpdate,
)

__all__ = [
    # Auth
    "Token",
    "TokenPayload",
    "LoginRequest",
    "PasswordChange",
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
    # SensorType
    "SensorTypeBase",
    "SensorTypeCreate",
    "SensorTypeUpdate",
    "SensorTypeResponse",
]
