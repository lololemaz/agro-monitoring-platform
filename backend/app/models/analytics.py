"""Modelos de analytics."""

from datetime import date
from uuid import uuid4

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.database import Base


class PlotProductionSnapshot(Base):
    """Snapshot de produção do talhão."""

    __tablename__ = "plot_production_snapshots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    plot_id = Column(
        UUID(as_uuid=True),
        ForeignKey("plots.id", ondelete="CASCADE"),
        nullable=False,
    )
    snapshot_date = Column(Date, nullable=False)
    status = Column(String(20), default="ok")
    health_score = Column(Numeric(5, 2))
    production_stage = Column(String(50))
    flowers_per_tree = Column(Numeric(8, 2))
    total_flowers = Column(Integer)
    flowering_percentage = Column(Numeric(5, 2))
    fruits_per_tree = Column(Numeric(8, 2))
    total_fruits = Column(Integer)
    avg_fruit_size = Column(Numeric(6, 2))
    fruit_caliber = Column(String(20))
    estimated_yield_kg = Column(Numeric(10, 2))
    estimated_yield_tons = Column(Numeric(10, 3))
    harvest_start_date = Column(Date)
    harvest_end_date = Column(Date)
    days_to_harvest = Column(Integer)
    risk_level = Column(String(20))
    risk_factors = Column(JSONB, default=[])
    last_soil_reading_id = Column(UUID(as_uuid=True))
    last_vision_data_id = Column(UUID(as_uuid=True))
    extra_data = Column(JSONB, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("plot_id", "snapshot_date", name="unique_plot_snapshot_date"),
    )
