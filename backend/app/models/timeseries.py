"""Modelos de séries temporais (TimescaleDB)."""

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import CHAR, JSONB, UUID

from app.database import Base


class UplinkTelemetry(Base):
    """Telemetria raw de IoT."""

    __tablename__ = "uplink_telemetry"

    time = Column(DateTime(timezone=True), nullable=False, primary_key=True)
    sensor_id = Column(
        UUID(as_uuid=True),
        ForeignKey("sensors.id", ondelete="CASCADE"),
        nullable=False,
        primary_key=True,
    )
    dev_eui = Column(CHAR(16))
    f_port = Column(SmallInteger)
    rssi = Column(SmallInteger)
    snr = Column(Numeric)
    payload = Column(JSONB, nullable=False)
    extra_data = Column(JSONB, default={})


class SoilReading(Base):
    """Leituras de solo."""

    __tablename__ = "soil_readings"

    time = Column(DateTime(timezone=True), nullable=False, primary_key=True)
    sensor_id = Column(
        UUID(as_uuid=True),
        ForeignKey("sensors.id", ondelete="CASCADE"),
        nullable=False,
        primary_key=True,
    )
    plot_id = Column(
        UUID(as_uuid=True),
        ForeignKey("plots.id", ondelete="CASCADE"),
        nullable=False,
    )
    moisture = Column(Numeric(5, 2))
    temperature = Column(Numeric(5, 2))
    ec = Column(Numeric(6, 3))
    ph = Column(Numeric(4, 2))
    nitrogen = Column(Numeric(6, 2))
    phosphorus = Column(Numeric(6, 2))
    potassium = Column(Numeric(6, 2))
    extra_data = Column(JSONB, default={})


class VisionData(Base):
    """Dados de visão computacional."""

    __tablename__ = "vision_data"

    time = Column(DateTime(timezone=True), nullable=False, primary_key=True)
    sensor_id = Column(
        UUID(as_uuid=True),
        ForeignKey("sensors.id", ondelete="CASCADE"),
        nullable=False,
        primary_key=True,
    )
    plot_id = Column(
        UUID(as_uuid=True),
        ForeignKey("plots.id", ondelete="CASCADE"),
        nullable=False,
    )
    # Thermal Camera
    irrigation_failures = Column(Integer, default=0)
    water_stress_level = Column(Numeric(5, 2))
    over_irrigation_detected = Column(Boolean, default=False)
    blocked_lines = Column(Integer, default=0)
    # RGB Camera
    fruit_count = Column(Integer, default=0)
    avg_fruit_size = Column(Numeric(6, 2))
    flowering_percentage = Column(Numeric(5, 2))
    pests_detected = Column(Boolean, default=False)
    pest_type = Column(String(100))
    fallen_fruits = Column(Integer, default=0)
    # Multispectral
    chlorophyll_level = Column(Numeric(5, 2))
    ndvi = Column(Numeric(4, 3))
    vegetative_stress = Column(Numeric(5, 2))
    maturity_index = Column(Numeric(5, 2))
    image_urls = Column(JSONB, default=[])
    extra_data = Column(JSONB, default={})


class WeatherData(Base):
    """Dados meteorológicos."""

    __tablename__ = "weather_data"

    time = Column(DateTime(timezone=True), nullable=False, primary_key=True)
    sensor_id = Column(
        UUID(as_uuid=True),
        ForeignKey("sensors.id", ondelete="CASCADE"),
        nullable=False,
        primary_key=True,
    )
    farm_id = Column(
        UUID(as_uuid=True),
        ForeignKey("farms.id", ondelete="SET NULL"),
        nullable=True,
    )
    temperature = Column(Numeric(5, 2))
    humidity = Column(Numeric(5, 2))
    pressure = Column(Numeric(7, 2))
    wind_speed = Column(Numeric(5, 2))
    wind_direction = Column(Integer)
    rainfall = Column(Numeric(6, 2))
    solar_radiation = Column(Numeric(7, 2))
    extra_data = Column(JSONB, default={})
