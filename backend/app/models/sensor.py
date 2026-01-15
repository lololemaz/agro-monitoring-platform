"""Modelos de sensores."""

from datetime import date
from uuid import uuid4

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.database import Base


class SensorType(Base):
    """Tipo de sensor (catálogo)."""

    __tablename__ = "sensor_types"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=True,
    )
    name = Column(String(100), nullable=False)
    slug = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    description = Column(Text)
    manufacturer = Column(String(100))
    model = Column(String(100))
    specifications = Column(JSONB, default={})
    supported_metrics = Column(JSONB, default=[])
    payload_schema = Column(JSONB)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        UniqueConstraint("organization_id", "slug", name="unique_sensor_type_slug_per_org"),
    )

    # Relationships
    sensors = relationship("Sensor", back_populates="sensor_type")


class Sensor(Base):
    """Sensor físico."""

    __tablename__ = "sensors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    farm_id = Column(
        UUID(as_uuid=True),
        ForeignKey("farms.id", ondelete="SET NULL"),
        nullable=True,
    )
    plot_id = Column(
        UUID(as_uuid=True),
        ForeignKey("plots.id", ondelete="SET NULL"),
        nullable=True,
    )
    sensor_type_id = Column(
        UUID(as_uuid=True),
        ForeignKey("sensor_types.id"),
        nullable=False,
    )
    name = Column(String(255), nullable=False)
    serial_number = Column(String(100), unique=True)
    mac_address = Column(String(50), unique=True)
    api_key = Column(String(255), unique=True)
    location = Column(JSONB)
    installation_date = Column(Date)
    last_signal_at = Column(DateTime(timezone=True), nullable=True)
    battery_level = Column(Integer)
    signal_strength = Column(Integer)
    is_online = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    firmware_version = Column(String(50))
    configuration = Column(JSONB, default={})
    extra_data = Column(JSONB, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Relationships
    organization = relationship("Organization")
    farm = relationship("Farm", back_populates="sensors")
    plot = relationship("Plot", back_populates="sensors")
    sensor_type = relationship("SensorType", back_populates="sensors")
