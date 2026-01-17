"""Rotas de fazendas."""

from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.deps import CurrentUser
from app.database import get_db
from app.models.alert import Alert
from app.models.farm import Farm, Plot
from app.models.sensor import Sensor
from app.models.timeseries import SoilReading, VisionData
from app.schemas.farm import FarmCreate, FarmResponse, FarmUpdate


class FarmSummaryResponse(BaseModel):
    """Schema de resposta para resumo da fazenda."""

    farm_id: UUID
    farm_name: str
    total_area: float | None
    total_plots: int
    total_trees: int
    total_sensors: int
    sensors_online: int
    sensors_offline: int
    plots_ok: int
    plots_warning: int
    plots_critical: int
    plots_offline: int
    active_alerts: int
    critical_alerts: int
    warning_alerts: int
    avg_moisture: float | None
    avg_temperature: float | None
    avg_ph: float | None
    health_score: int
    estimated_yield_kg: float


router = APIRouter()


@router.get("/", response_model=list[FarmResponse])
async def list_farms(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Lista fazendas da organização do usuário."""
    if current_user.is_superuser:
        # Superuser vê todas as fazendas
        farms = db.query(Farm).filter(Farm.deleted_at.is_(None)).all()
    else:
        # Usuário normal vê apenas fazendas da sua organização
        farms = db.query(Farm).filter(
            Farm.organization_id == current_user.organization_id,
            Farm.deleted_at.is_(None),
        ).all()
    return farms


@router.get("/{farm_id}", response_model=FarmResponse)
async def get_farm(
    farm_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Obtém uma fazenda específica."""
    query = db.query(Farm).filter(Farm.id == farm_id, Farm.deleted_at.is_(None))

    # Se não for superuser, filtra por organização
    if not current_user.is_superuser:
        query = query.filter(Farm.organization_id == current_user.organization_id)

    farm = query.first()

    if not farm:
        raise HTTPException(status_code=404, detail="Fazenda não encontrada")

    return farm


@router.post("/", response_model=FarmResponse, status_code=status.HTTP_201_CREATED)
async def create_farm(
    farm_data: FarmCreate,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Cria uma nova fazenda."""
    # Determina a organização
    if current_user.is_superuser:
        # Superuser DEVE informar a organização
        if not farm_data.organization_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Superuser deve informar organization_id",
            )
        org_id = farm_data.organization_id
    else:
        # Usuário normal usa sua própria organização
        if not current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Usuário não pertence a uma organização",
            )
        org_id = current_user.organization_id

    farm = Farm(
        organization_id=org_id,
        name=farm_data.name,
        code=farm_data.code,
        total_area=farm_data.total_area,
        address=farm_data.address,
        coordinates=farm_data.coordinates,
        timezone=farm_data.timezone,
        settings=farm_data.settings,
        created_by=current_user.id,
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm


@router.patch("/{farm_id}", response_model=FarmResponse)
async def update_farm(
    farm_id: UUID,
    farm_data: FarmUpdate,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Atualiza uma fazenda."""
    query = db.query(Farm).filter(Farm.id == farm_id, Farm.deleted_at.is_(None))

    if not current_user.is_superuser:
        query = query.filter(Farm.organization_id == current_user.organization_id)

    farm = query.first()

    if not farm:
        raise HTTPException(status_code=404, detail="Fazenda não encontrada")

    update_data = farm_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(farm, field, value)

    db.commit()
    db.refresh(farm)
    return farm


@router.delete("/{farm_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_farm(
    farm_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Remove uma fazenda (soft delete)."""
    query = db.query(Farm).filter(Farm.id == farm_id, Farm.deleted_at.is_(None))

    if not current_user.is_superuser:
        query = query.filter(Farm.organization_id == current_user.organization_id)

    farm = query.first()

    if not farm:
        raise HTTPException(status_code=404, detail="Fazenda nao encontrada")

    farm.deleted_at = datetime.now(timezone.utc)
    db.commit()


def calculate_plot_status_from_readings(soil: SoilReading | None) -> str:
    """Calcula status do talhao baseado na leitura de solo."""
    if not soil:
        return "offline"

    moisture = float(soil.moisture) if soil.moisture else None
    ph = float(soil.ph) if soil.ph else None
    temp = float(soil.temperature) if soil.temperature else None

    if moisture is not None and (moisture < 10 or moisture > 35):
        return "critical"
    if ph is not None and (ph < 5.5 or ph > 8.0):
        return "critical"
    if temp is not None and temp > 40:
        return "critical"

    if moisture is not None and (moisture < 15 or moisture > 30):
        return "warning"
    if ph is not None and (ph < 6.0 or ph > 7.5):
        return "warning"
    if temp is not None and (temp < 15 or temp > 35):
        return "warning"

    return "ok"


@router.get("/{farm_id}/summary", response_model=FarmSummaryResponse)
async def get_farm_summary(
    farm_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Obtem resumo completo de uma fazenda.

    Inclui estatisticas de talhoes, sensores, alertas e metricas agregadas.
    """
    query = db.query(Farm).filter(Farm.id == farm_id, Farm.deleted_at.is_(None))

    if not current_user.is_superuser:
        query = query.filter(Farm.organization_id == current_user.organization_id)

    farm = query.first()
    if not farm:
        raise HTTPException(status_code=404, detail="Fazenda nao encontrada")

    plots = (
        db.query(Plot)
        .filter(Plot.farm_id == farm_id, Plot.deleted_at.is_(None), Plot.is_active == True)
        .all()
    )

    sensors = (
        db.query(Sensor)
        .filter(Sensor.farm_id == farm_id, Sensor.deleted_at.is_(None), Sensor.is_active == True)
        .all()
    )

    alerts = (
        db.query(Alert)
        .filter(Alert.farm_id == farm_id, Alert.acknowledged_at.is_(None))
        .all()
    )

    plots_ok = 0
    plots_warning = 0
    plots_critical = 0
    plots_offline = 0
    total_trees = 0
    moisture_values = []
    temperature_values = []
    ph_values = []
    total_fruit_count = 0

    for plot in plots:
        total_trees += plot.tree_count or 0

        soil_reading = (
            db.query(SoilReading)
            .filter(SoilReading.plot_id == plot.id)
            .order_by(SoilReading.time.desc())
            .first()
        )

        status = calculate_plot_status_from_readings(soil_reading)

        if status == "ok":
            plots_ok += 1
        elif status == "warning":
            plots_warning += 1
        elif status == "critical":
            plots_critical += 1
        else:
            plots_offline += 1

        if soil_reading:
            if soil_reading.moisture is not None:
                moisture_values.append(float(soil_reading.moisture))
            if soil_reading.temperature is not None:
                temperature_values.append(float(soil_reading.temperature))
            if soil_reading.ph is not None:
                ph_values.append(float(soil_reading.ph))

        vision_data = (
            db.query(VisionData)
            .filter(VisionData.plot_id == plot.id)
            .order_by(VisionData.time.desc())
            .first()
        )

        if vision_data and vision_data.fruit_count:
            total_fruit_count += vision_data.fruit_count

    sensors_online = sum(1 for s in sensors if s.is_online)
    sensors_offline = len(sensors) - sensors_online

    critical_alerts = sum(1 for a in alerts if a.severity == "critical")
    warning_alerts = sum(1 for a in alerts if a.severity == "warning")

    avg_moisture = sum(moisture_values) / len(moisture_values) if moisture_values else None
    avg_temperature = sum(temperature_values) / len(temperature_values) if temperature_values else None
    avg_ph = sum(ph_values) / len(ph_values) if ph_values else None

    base_score = 100
    if plots_critical > 0:
        base_score -= plots_critical * 15
    if plots_warning > 0:
        base_score -= plots_warning * 5
    if plots_offline > 0:
        base_score -= plots_offline * 10
    if critical_alerts > 0:
        base_score -= critical_alerts * 10
    if warning_alerts > 0:
        base_score -= warning_alerts * 3
    health_score = max(0, min(100, base_score))

    avg_fruit_weight_kg = 0.35
    estimated_yield_kg = total_fruit_count * avg_fruit_weight_kg

    return FarmSummaryResponse(
        farm_id=farm.id,
        farm_name=farm.name,
        total_area=float(farm.total_area) if farm.total_area else None,
        total_plots=len(plots),
        total_trees=total_trees,
        total_sensors=len(sensors),
        sensors_online=sensors_online,
        sensors_offline=sensors_offline,
        plots_ok=plots_ok,
        plots_warning=plots_warning,
        plots_critical=plots_critical,
        plots_offline=plots_offline,
        active_alerts=len(alerts),
        critical_alerts=critical_alerts,
        warning_alerts=warning_alerts,
        avg_moisture=avg_moisture,
        avg_temperature=avg_temperature,
        avg_ph=avg_ph,
        health_score=health_score,
        estimated_yield_kg=estimated_yield_kg,
    )
