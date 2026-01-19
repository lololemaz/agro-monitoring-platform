"""Schemas de usuário."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RoleResponse(BaseModel):
    """Schema de resposta de role."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    description: str | None = None
    is_system_role: bool
    permissions: list[str]


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
    role_id: UUID | None = None


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
    role_id: UUID | None = None


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
    roles: list[RoleResponse] = []

    @classmethod
    def from_user(cls, user) -> "UserResponse":
        """Cria UserResponse a partir de um objeto User com roles."""
        # Extrai os roles a partir de user_roles
        roles = []
        if hasattr(user, 'roles') and user.roles:
            for user_role in user.roles:
                if hasattr(user_role, 'role') and user_role.role:
                    roles.append(RoleResponse.model_validate(user_role.role))
        
        return cls(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone,
            organization_id=user.organization_id,
            avatar_url=user.avatar_url,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            is_org_owner=user.is_org_owner,
            is_email_verified=user.is_email_verified,
            last_login_at=user.last_login_at,
            created_at=user.created_at,
            updated_at=user.updated_at,
            roles=roles,
        )


class UserInDB(UserResponse):
    """Schema de usuário com dados internos."""

    password_hash: str
