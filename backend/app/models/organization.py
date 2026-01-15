"""Modelos de organização e usuários."""

from uuid import uuid4

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Organization(Base):
    """Organização (multi-tenant)."""

    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False)
    company_name = Column(String(255))
    document = Column(String(50), unique=True)
    email = Column(String(255))
    phone = Column(String(50))
    address = Column(Text)
    logo_url = Column(Text)
    settings = Column(JSONB, default={})
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    farms = relationship("Farm", back_populates="organization", cascade="all, delete-orphan")


class User(Base):
    """Usuário do sistema."""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=True,  # NULL para superusers
    )
    email = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    phone = Column(String(50))
    avatar_url = Column(Text)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    is_org_owner = Column(Boolean, default=False)
    is_email_verified = Column(Boolean, default=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        # Email único por organização (para usuários normais)
        UniqueConstraint("organization_id", "email", name="unique_user_email_per_org"),
        # Índice para superusers (email único global quando org_id é NULL)
        Index("idx_superuser_email", "email", unique=True, postgresql_where=(organization_id.is_(None))),
    )

    # Relationships
    organization = relationship("Organization", back_populates="users")
    roles = relationship(
        "UserRole",
        back_populates="user",
        cascade="all, delete-orphan",
        foreign_keys="[UserRole.user_id]",
    )

    @property
    def full_name(self) -> str:
        """Retorna nome completo do usuário."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name or self.last_name or self.email


class Role(Base):
    """Papel/permissão do usuário."""

    __tablename__ = "roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=True,  # NULL = role de sistema
    )
    name = Column(String(100), nullable=False)
    slug = Column(String(100), nullable=False)
    description = Column(Text)
    is_system_role = Column(Boolean, default=False)
    permissions = Column(JSONB, default=[])
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        UniqueConstraint("organization_id", "slug", name="unique_role_slug_per_org"),
    )

    # Relationships
    user_roles = relationship("UserRole", back_populates="role", cascade="all, delete-orphan")


class UserRole(Base):
    """Associação usuário-papel."""

    __tablename__ = "user_roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    role_id = Column(
        UUID(as_uuid=True),
        ForeignKey("roles.id", ondelete="CASCADE"),
        nullable=False,
    )
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    assigned_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "role_id", name="unique_user_role"),
    )

    # Relationships
    user = relationship("User", back_populates="roles", foreign_keys=[user_id])
    role = relationship("Role", back_populates="user_roles")
