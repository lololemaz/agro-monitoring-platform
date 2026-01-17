"""Schemas de organização."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr


class OrganizationBase(BaseModel):
    """Schema base de organização."""

    name: str
    company_name: str | None = None
    document: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    address: str | None = None


class OrganizationCreate(OrganizationBase):
    """Schema para criação de organização."""

    # Dados do owner inicial
    owner_email: EmailStr
    owner_password: str
    owner_first_name: str | None = None
    owner_last_name: str | None = None


class OrganizationUpdate(BaseModel):
    """Schema para atualização de organização."""

    name: str | None = None
    company_name: str | None = None
    document: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    address: str | None = None
    logo_url: str | None = None
    settings: dict | None = None
    is_active: bool | None = None


class OrganizationResponse(OrganizationBase):
    """Schema de resposta de organização."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    logo_url: str | None
    settings: dict
    is_active: bool
    created_at: datetime
    updated_at: datetime


class OrganizationWithOwner(OrganizationResponse):
    """Schema de organização com dados do owner."""

    owner_id: UUID | None = None
    owner_email: str | None = None
    owner_first_name: str | None = None
    owner_last_name: str | None = None