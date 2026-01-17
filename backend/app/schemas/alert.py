"""Schemas de alertas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AlertBase(BaseModel):
    """Schema base de alerta."""

    farm_id: UUID | None = None
    plot_id: UUID | None = None
    row_id: UUID | None = None
    tree_id: UUID | None = None
    category: str
    severity: str
    type: str
    title: str
    message: str
    impact: str | None = None
    suggested_action: str | None = None
    source: str | None = None
    source_id: UUID | None = None
    extra_data: dict = {}


class AlertCreate(AlertBase):
    """Schema para criacao de alerta."""

    pass


class AlertUpdate(BaseModel):
    """Schema para atualizacao de alerta."""

    category: str | None = None
    severity: str | None = None
    type: str | None = None
    title: str | None = None
    message: str | None = None
    impact: str | None = None
    suggested_action: str | None = None
    extra_data: dict | None = None


class AlertAcknowledge(BaseModel):
    """Schema para reconhecimento de alerta."""

    notes: str | None = None


class AlertResolve(BaseModel):
    """Schema para resolucao de alerta."""

    resolution_notes: str | None = None


class AlertResponse(AlertBase):
    """Schema de resposta de alerta."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    timestamp: datetime
    acknowledged_at: datetime | None = None
    acknowledged_by: UUID | None = None
    resolved_at: datetime | None = None
    resolved_by: UUID | None = None
    resolution_notes: str | None = None
    recurrence_count: int = 0
    created_at: datetime
    updated_at: datetime
