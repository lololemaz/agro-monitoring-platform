"""Rotas de alertas."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import CurrentUser
from app.database import get_db
from app.models.alert import Alert

router = APIRouter()


def get_user_alerts_query(db: Session, current_user):
    """Retorna query base para alertas do usuário."""
    query = db.query(Alert)

    if not current_user.is_superuser:
        query = query.filter(Alert.organization_id == current_user.organization_id)

    return query


@router.get("/")
async def list_alerts(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    resolved: bool | None = None,
):
    """Lista alertas da organização.

    Args:
        resolved: Se True, retorna apenas resolvidos. Se False, apenas não resolvidos.
    """
    query = get_user_alerts_query(db, current_user)

    if resolved is True:
        query = query.filter(Alert.resolved_at.is_not(None))
    elif resolved is False:
        query = query.filter(Alert.resolved_at.is_(None))

    return query.order_by(Alert.timestamp.desc()).all()


@router.get("/{alert_id}")
async def get_alert(
    alert_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Obtém um alerta específico."""
    query = get_user_alerts_query(db, current_user)
    alert = query.filter(Alert.id == alert_id).first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alerta não encontrado")

    return alert


@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Marca um alerta como reconhecido."""
    from datetime import datetime, timezone

    query = get_user_alerts_query(db, current_user)
    alert = query.filter(Alert.id == alert_id).first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alerta não encontrado")

    if alert.acknowledged_at:
        raise HTTPException(status_code=400, detail="Alerta já foi reconhecido")

    alert.acknowledged_at = datetime.now(timezone.utc)
    alert.acknowledged_by = current_user.id
    db.commit()
    db.refresh(alert)

    return alert


@router.post("/{alert_id}/resolve")
async def resolve_alert(
    alert_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    resolution_notes: str | None = None,
):
    """Marca um alerta como resolvido."""
    from datetime import datetime, timezone

    query = get_user_alerts_query(db, current_user)
    alert = query.filter(Alert.id == alert_id).first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alerta não encontrado")

    if alert.resolved_at:
        raise HTTPException(status_code=400, detail="Alerta já foi resolvido")

    alert.resolved_at = datetime.now(timezone.utc)
    alert.resolved_by = current_user.id
    if resolution_notes:
        alert.resolution_notes = resolution_notes
    db.commit()
    db.refresh(alert)

    return alert
