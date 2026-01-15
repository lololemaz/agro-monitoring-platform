"""Modelos de anotações."""

from uuid import uuid4

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class Note(Base):
    """Anotação."""

    __tablename__ = "notes"

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
    text = Column(Text, nullable=False)
    category = Column(String(50))
    created_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
    deleted_at = Column(DateTime(timezone=True), nullable=True)
