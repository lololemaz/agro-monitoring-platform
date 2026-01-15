"""Modelos de alertas."""

from uuid import uuid4

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Alert(Base):
    """Alerta do sistema."""

    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    farm_id = Column(
        UUID(as_uuid=True),
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=True,
    )
    plot_id = Column(
        UUID(as_uuid=True),
        ForeignKey("plots.id", ondelete="CASCADE"),
        nullable=True,
    )
    row_id = Column(
        UUID(as_uuid=True),
        ForeignKey("rows.id", ondelete="SET NULL"),
        nullable=True,
    )
    tree_id = Column(
        UUID(as_uuid=True),
        ForeignKey("trees.id", ondelete="SET NULL"),
        nullable=True,
    )
    category = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)
    type = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    impact = Column(Text)
    suggested_action = Column(Text)
    source = Column(String(50))
    source_id = Column(UUID(as_uuid=True))
    timestamp = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    acknowledged_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    resolution_notes = Column(Text)
    recurrence_count = Column(Integer, default=1)
    extra_data = Column(JSONB, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


class AlertRule(Base):
    """Regra de alerta."""

    __tablename__ = "alert_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    name = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)
    conditions = Column(JSONB, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
