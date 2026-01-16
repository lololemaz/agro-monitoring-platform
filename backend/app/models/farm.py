"""Modelos de fazenda e talhões."""

from datetime import date
from uuid import uuid4

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Farm(Base):
    """Fazenda."""

    __tablename__ = "farms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    name = Column(String(255), nullable=False)
    code = Column(String(50))
    total_area = Column(Numeric(10, 2))
    address = Column(Text)
    coordinates = Column(JSONB)
    timezone = Column(String(50), default="America/Recife")
    settings = Column(JSONB, default={})
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="farms")
    plots = relationship("Plot", back_populates="farm", cascade="all, delete-orphan")
    sensors = relationship("Sensor", back_populates="farm")


class Plot(Base):
    """Talhão."""

    __tablename__ = "plots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    farm_id = Column(
        UUID(as_uuid=True),
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
    )
    name = Column(String(100), nullable=False)
    code = Column(String(50))
    area = Column(Numeric(10, 2), nullable=False)
    crop_type = Column(String(100), default="Manga - Tommy Atkins")
    variety = Column(String(100))
    planting_date = Column(Date)
    season = Column(String(50))
    row_count = Column(Integer, default=0)
    tree_count = Column(Integer, default=0)
    coordinates = Column(JSONB)
    grid_position = Column(JSONB)
    extra_data = Column(JSONB, default={})
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    __table_args__ = (
        UniqueConstraint("farm_id", "code", name="unique_plot_code_per_farm"),
    )

    # Relationships
    farm = relationship("Farm", back_populates="plots")
    rows = relationship("Row", back_populates="plot", cascade="all, delete-orphan")
    sensors = relationship("Sensor", back_populates="plot")


class Row(Base):
    """Linha de plantio."""

    __tablename__ = "rows"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    plot_id = Column(
        UUID(as_uuid=True),
        ForeignKey("plots.id", ondelete="CASCADE"),
        nullable=False,
    )
    row_number = Column(Integer, nullable=False)
    tree_count = Column(Integer, default=0)
    avg_health = Column(Numeric(5, 2))
    irrigation_status = Column(String(20), default="ok")
    extra_data = Column(JSONB, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        UniqueConstraint("plot_id", "row_number", name="unique_row_per_plot"),
    )

    # Relationships
    plot = relationship("Plot", back_populates="rows")
    trees = relationship("Tree", back_populates="row", cascade="all, delete-orphan")


class Tree(Base):
    """Árvore individual."""

    __tablename__ = "trees"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    row_id = Column(
        UUID(as_uuid=True),
        ForeignKey("rows.id", ondelete="CASCADE"),
        nullable=False,
    )
    plot_id = Column(
        UUID(as_uuid=True),
        ForeignKey("plots.id", ondelete="CASCADE"),
        nullable=False,
    )
    tree_number = Column(Integer, nullable=False)
    variety = Column(String(100))
    planting_date = Column(Date)
    health_score = Column(Numeric(5, 2))
    fruit_count = Column(Integer, default=0)
    last_inspection = Column(Date)
    coordinates = Column(JSONB)
    extra_data = Column(JSONB, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        UniqueConstraint("row_id", "tree_number", name="unique_tree_per_row"),
    )

    # Relationships
    row = relationship("Row", back_populates="trees")
    plot = relationship("Plot")
