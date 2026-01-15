"""Schemas de usuário."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    """Schema base de usuário."""

    email: EmailStr
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None


class UserCreate(UserBase):
    """Schema para criação de usuário."""

    password: str = Field(..., min_length=8)
    is_org_owner: bool = False


class SuperUserCreate(UserBase):
    """Schema para criação de superusuário."""

    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    """Schema para atualização de usuário."""

    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    avatar_url: str | None = None
    is_active: bool | None = None


class UserResponse(UserBase):
    """Schema de resposta de usuário."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID | None
    avatar_url: str | None
    is_active: bool
    is_superuser: bool
    is_org_owner: bool
    is_email_verified: bool
    last_login_at: datetime | None
    created_at: datetime
    updated_at: datetime


class UserInDB(UserResponse):
    """Schema de usuário com dados internos."""

    password_hash: str
