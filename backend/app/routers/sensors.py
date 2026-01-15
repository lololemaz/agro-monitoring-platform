"""Rotas de sensores."""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import CurrentUser
from app.database import get_db
from app.models.sensor import Sensor, SensorType
from app.services.sensor_type_service import SensorTypeService

router = APIRouter()


def get_user_sensors_query(db: Session, current_user):
    """Retorna query base para sensores do usuário."""
    query = db.query(Sensor).filter(Sensor.deleted_at.is_(None))

    if not current_user.is_superuser:
        query = query.filter(Sensor.organization_id == current_user.organization_id)

    return query


@router.get("/")
async def list_sensors(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Lista sensores da organização."""
    return get_user_sensors_query(db, current_user).all()


@router.get("/types")
async def list_sensor_types(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Lista tipos de sensor disponíveis para a organização.

    Inclui tipos globais e específicos da organização.
    """
    sensor_type_service = SensorTypeService(db)

    if current_user.is_superuser:
        return sensor_type_service.get_all_global()
    else:
        return sensor_type_service.get_all_for_organization(current_user.organization_id)


@router.get("/{sensor_id}")
async def get_sensor(
    sensor_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Obtém um sensor específico."""
    query = get_user_sensors_query(db, current_user)
    sensor = query.filter(Sensor.id == sensor_id).first()

    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor não encontrado")

    return sensor


@router.delete("/{sensor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sensor(
    sensor_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Remove um sensor (soft delete)."""
    query = get_user_sensors_query(db, current_user)
    sensor = query.filter(Sensor.id == sensor_id).first()

    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor não encontrado")

    sensor.deleted_at = datetime.now(timezone.utc)
    db.commit()
