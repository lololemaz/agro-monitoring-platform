"""Modelos de eventos."""

from uuid import uuid4

from sqlalchemy import (
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


class Event(Base):
    """Evento da fazenda."""

    __tablename__ = "events"

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
        ForeignKey("plots.id", ondelete="SET NULL"),
        nullable=True,
    )
    row_id = Column(
        UUID(as_uuid=True),
        ForeignKey("rows.id", ondelete="SET NULL"),
        nullable=True,
    )
    type = Column(String(50), nullable=False)
    scope = Column(String(20), nullable=False)
    scope_id = Column(UUID(as_uuid=True))
    scope_name = Column(String(255))
    title = Column(String(255), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    irrigation_data = Column(JSONB)
    fertilization_data = Column(JSONB)
    product_data = Column(JSONB)
    notes = Column(Text)
    operator = Column(String(255))
    team = Column(String(255))
    tags = Column(JSONB, default=[])
    created_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    attachments = relationship("EventAttachment", back_populates="event", cascade="all, delete-orphan")


class EventAttachment(Base):
    """Anexo de evento."""

    __tablename__ = "event_attachments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    event_id = Column(
        UUID(as_uuid=True),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
    )
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)
    url = Column(Text, nullable=False)
    file_size = Column(Integer)
    mime_type = Column(String(100))
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    event = relationship("Event", back_populates="attachments")
