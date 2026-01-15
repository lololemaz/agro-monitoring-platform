"""Rotas de eventos."""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import CurrentUser
from app.database import get_db
from app.models.event import Event

router = APIRouter()


def get_user_events_query(db: Session, current_user):
    """Retorna query base para eventos do usuário."""
    query = db.query(Event).filter(Event.deleted_at.is_(None))

    if not current_user.is_superuser:
        query = query.filter(Event.organization_id == current_user.organization_id)

    return query


@router.get("/")
async def list_events(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    event_type: str | None = None,
    plot_id: UUID | None = None,
):
    """Lista eventos da organização.

    Args:
        event_type: Filtra por tipo de evento.
        plot_id: Filtra por talhão.
    """
    query = get_user_events_query(db, current_user)

    if event_type:
        query = query.filter(Event.type == event_type)

    if plot_id:
        query = query.filter(Event.plot_id == plot_id)

    return query.order_by(Event.timestamp.desc()).all()


@router.get("/{event_id}")
async def get_event(
    event_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Obtém um evento específico."""
    query = get_user_events_query(db, current_user)
    event = query.filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")

    return event


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Remove um evento (soft delete)."""
    query = get_user_events_query(db, current_user)
    event = query.filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")

    event.deleted_at = datetime.now(timezone.utc)
    db.commit()
