"""Rotas de eventos."""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import CurrentUser
from app.database import get_db
from app.models.event import Event
from app.schemas.event import EventCreate, EventResponse, EventUpdate

router = APIRouter()


def get_user_events_query(db: Session, current_user):
    """Retorna query base para eventos do usuario."""
    query = db.query(Event).filter(Event.deleted_at.is_(None))

    if not current_user.is_superuser:
        query = query.filter(Event.organization_id == current_user.organization_id)

    return query


@router.get("/", response_model=list[EventResponse])
async def list_events(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    farm_id: UUID | None = None,
    plot_id: UUID | None = None,
    type: str | None = None,
    scope: str | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    limit: int = Query(default=100, le=500),
    sort_by: str = "timestamp",
    sort_order: str = "desc",
):
    """Lista eventos da organizacao.

    Parametros:
        farm_id: Filtrar por fazenda
        plot_id: Filtrar por talhao
        type: Filtrar por tipo (irrigation, fertilization, nutrients, etc)
        scope: Filtrar por escopo (farm, plot, subarea, tree_group)
        start_date: Filtrar eventos a partir desta data
        end_date: Filtrar eventos ate esta data
        limit: Numero maximo de eventos (padrao: 100, max: 500)
        sort_by: Campo para ordenacao (timestamp, created_at)
        sort_order: Ordem (asc, desc)
    """
    query = get_user_events_query(db, current_user)

    if farm_id:
        query = query.filter(Event.farm_id == farm_id)

    if plot_id:
        query = query.filter(Event.plot_id == plot_id)

    if type:
        query = query.filter(Event.type == type)

    if scope:
        query = query.filter(Event.scope == scope)

    if start_date:
        query = query.filter(Event.timestamp >= start_date)

    if end_date:
        query = query.filter(Event.timestamp <= end_date)

    if sort_by == "timestamp":
        order_col = Event.timestamp
    else:
        order_col = Event.created_at

    if sort_order == "asc":
        query = query.order_by(order_col.asc())
    else:
        query = query.order_by(order_col.desc())

    return query.limit(limit).all()


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Obtem um evento especifico."""
    query = get_user_events_query(db, current_user)
    event = query.filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Evento nao encontrado")

    return event


@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_data: EventCreate,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Cria um novo evento."""
    org_id = current_user.organization_id
    if current_user.is_superuser and not org_id:
        raise HTTPException(
            status_code=400,
            detail="Superuser deve especificar organization_id",
        )

    event = Event(
        organization_id=org_id,
        farm_id=event_data.farm_id,
        plot_id=event_data.plot_id,
        row_id=event_data.row_id,
        type=event_data.type,
        scope=event_data.scope,
        scope_id=event_data.scope_id,
        scope_name=event_data.scope_name,
        title=event_data.title,
        timestamp=event_data.timestamp,
        irrigation_data=event_data.irrigation_data.model_dump() if event_data.irrigation_data else None,
        fertilization_data=event_data.fertilization_data.model_dump() if event_data.fertilization_data else None,
        product_data=event_data.product_data.model_dump() if event_data.product_data else None,
        notes=event_data.notes,
        operator=event_data.operator,
        team=event_data.team,
        tags=event_data.tags or [],
        created_by=current_user.id,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: UUID,
    event_data: EventUpdate,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Atualiza um evento."""
    query = get_user_events_query(db, current_user)
    event = query.filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Evento nao encontrado")

    update_data = event_data.model_dump(exclude_unset=True)

    for key in ["irrigation_data", "fertilization_data", "product_data"]:
        if key in update_data and update_data[key] is not None:
            update_data[key] = update_data[key]

    for field, value in update_data.items():
        setattr(event, field, value)

    event.updated_by = current_user.id
    db.commit()
    db.refresh(event)
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
        raise HTTPException(status_code=404, detail="Evento nao encontrado")

    event.deleted_at = datetime.now(timezone.utc)
    db.commit()
