"""Rotas de alertas."""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import CurrentUser
from app.database import get_db
from app.models.alert import Alert
from app.schemas.alert import (
    AlertAcknowledge,
    AlertCreate,
    AlertResolve,
    AlertResponse,
)

router = APIRouter()


def get_user_alerts_query(db: Session, current_user):
    """Retorna query base para alertas do usuario."""
    query = db.query(Alert)

    if not current_user.is_superuser:
        query = query.filter(Alert.organization_id == current_user.organization_id)

    return query


@router.get("/", response_model=list[AlertResponse])
async def list_alerts(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    farm_id: UUID | None = None,
    plot_id: UUID | None = None,
    category: str | None = None,
    severity: str | None = None,
    resolved: bool | None = None,
    acknowledged: bool | None = None,
    limit: int = Query(default=100, le=500),
):
    """Lista alertas da organizacao.

    Parametros:
        farm_id: Filtrar por fazenda
        plot_id: Filtrar por talhao
        category: Filtrar por categoria (irrigation, soil, pests, health, production, system)
        severity: Filtrar por severidade (critical, warning, info)
        resolved: Se True, apenas resolvidos. Se False, apenas nao resolvidos
        acknowledged: Se True, apenas reconhecidos. Se False, apenas nao reconhecidos
        limit: Numero maximo de alertas (padrao: 100, max: 500)
    """
    query = get_user_alerts_query(db, current_user)

    if farm_id:
        query = query.filter(Alert.farm_id == farm_id)

    if plot_id:
        query = query.filter(Alert.plot_id == plot_id)

    if category:
        query = query.filter(Alert.category == category)

    if severity:
        query = query.filter(Alert.severity == severity)

    if resolved is True:
        query = query.filter(Alert.resolved_at.is_not(None))
    elif resolved is False:
        query = query.filter(Alert.resolved_at.is_(None))

    if acknowledged is True:
        query = query.filter(Alert.acknowledged_at.is_not(None))
    elif acknowledged is False:
        query = query.filter(Alert.acknowledged_at.is_(None))

    return query.order_by(Alert.timestamp.desc()).limit(limit).all()


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Obtem um alerta especifico."""
    query = get_user_alerts_query(db, current_user)
    alert = query.filter(Alert.id == alert_id).first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alerta nao encontrado")

    return alert


@router.post("/", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(
    alert_data: AlertCreate,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Cria um novo alerta."""
    org_id = current_user.organization_id
    if current_user.is_superuser and not org_id:
        raise HTTPException(
            status_code=400,
            detail="Superuser deve especificar organization_id",
        )

    alert = Alert(
        organization_id=org_id,
        farm_id=alert_data.farm_id,
        plot_id=alert_data.plot_id,
        row_id=alert_data.row_id,
        tree_id=alert_data.tree_id,
        category=alert_data.category,
        severity=alert_data.severity,
        type=alert_data.type,
        title=alert_data.title,
        message=alert_data.message,
        impact=alert_data.impact,
        suggested_action=alert_data.suggested_action,
        source=alert_data.source,
        source_id=alert_data.source_id,
        extra_data=alert_data.extra_data or {},
        timestamp=datetime.now(timezone.utc),
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.patch("/{alert_id}/acknowledge", response_model=AlertResponse)
async def acknowledge_alert(
    alert_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    data: AlertAcknowledge | None = None,
):
    """Marca um alerta como reconhecido."""
    query = get_user_alerts_query(db, current_user)
    alert = query.filter(Alert.id == alert_id).first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alerta nao encontrado")

    if alert.acknowledged_at:
        raise HTTPException(status_code=400, detail="Alerta ja foi reconhecido")

    alert.acknowledged_at = datetime.now(timezone.utc)
    alert.acknowledged_by = current_user.id
    db.commit()
    db.refresh(alert)

    return alert


@router.patch("/{alert_id}/resolve", response_model=AlertResponse)
async def resolve_alert(
    alert_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    data: AlertResolve | None = None,
):
    """Marca um alerta como resolvido."""
    query = get_user_alerts_query(db, current_user)
    alert = query.filter(Alert.id == alert_id).first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alerta nao encontrado")

    if alert.resolved_at:
        raise HTTPException(status_code=400, detail="Alerta ja foi resolvido")

    alert.resolved_at = datetime.now(timezone.utc)
    alert.resolved_by = current_user.id
    if data and data.resolution_notes:
        alert.resolution_notes = data.resolution_notes
    db.commit()
    db.refresh(alert)

    return alert
