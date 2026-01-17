"""Rotas de sensores."""

from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import CurrentUser
from app.database import get_db
from app.models.farm import Farm, Plot
from app.models.sensor import Sensor, SensorType
from app.models.timeseries import SoilReading
from app.schemas.sensor import SensorHealthIssueResponse, SensorHeatmapData, SensorResponse
from app.services.sensor_type_service import SensorTypeService

router = APIRouter()


def get_user_sensors_query(db: Session, current_user):
    """Retorna query base para sensores do usuario."""
    query = db.query(Sensor).filter(Sensor.deleted_at.is_(None))

    if not current_user.is_superuser:
        query = query.filter(Sensor.organization_id == current_user.organization_id)

    return query


@router.get("/", response_model=list[SensorResponse])
async def list_sensors(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    farm_id: UUID | None = None,
    plot_id: UUID | None = None,
    is_online: bool | None = None,
):
    """Lista sensores da organizacao.

    Parametros:
        farm_id: Filtrar por fazenda
        plot_id: Filtrar por talhao
        is_online: Filtrar por status online/offline
    """
    query = get_user_sensors_query(db, current_user)

    if farm_id:
        query = query.filter(Sensor.farm_id == farm_id)
    if plot_id:
        query = query.filter(Sensor.plot_id == plot_id)
    if is_online is not None:
        query = query.filter(Sensor.is_online == is_online)

    return query.all()


@router.get("/health-issues", response_model=list[SensorHealthIssueResponse])
async def get_sensor_health_issues(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    farm_id: UUID | None = None,
):
    """Lista sensores com problemas de saude.

    Retorna sensores que estao:
    - Offline (sem sinal ha mais de 2 horas)
    - Com bateria baixa (< 30%)
    - Com sinal fraco (< 40%)

    Parametros:
        farm_id: Filtrar por fazenda
    """
    query = get_user_sensors_query(db, current_user)

    if farm_id:
        query = query.filter(Sensor.farm_id == farm_id)

    sensors = query.all()
    issues = []
    now = datetime.now(timezone.utc)
    offline_threshold = now - timedelta(hours=2)

    for sensor in sensors:
        issue = None

        is_offline = (
            not sensor.is_online
            or sensor.last_signal_at is None
            or sensor.last_signal_at < offline_threshold
        )

        if is_offline:
            issue = "offline"
        elif sensor.battery_level is not None and sensor.battery_level < 30:
            issue = "low_battery"
        elif sensor.signal_strength is not None and sensor.signal_strength < 40:
            issue = "weak_signal"

        if issue:
            plot_name = None
            if sensor.plot_id:
                plot = db.query(Plot).filter(Plot.id == sensor.plot_id).first()
                if plot:
                    plot_name = plot.name

            sensor_type_name = "unknown"
            if sensor.sensor_type_id:
                sensor_type = (
                    db.query(SensorType)
                    .filter(SensorType.id == sensor.sensor_type_id)
                    .first()
                )
                if sensor_type:
                    sensor_type_name = sensor_type.name

            issues.append(
                SensorHealthIssueResponse(
                    sensor_id=sensor.id,
                    sensor_name=sensor.name,
                    plot_id=sensor.plot_id,
                    plot_name=plot_name,
                    sensor_type=sensor_type_name,
                    last_signal_at=sensor.last_signal_at,
                    battery_level=sensor.battery_level,
                    signal_strength=sensor.signal_strength,
                    is_online=sensor.is_online,
                    issue=issue,
                )
            )

    return issues


@router.get("/heatmap-data", response_model=list[SensorHeatmapData])
async def get_heatmap_data(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    farm_id: UUID | None = None,
):
    """Retorna dados de sensores para visualizacao em heatmap.

    Inclui leituras mais recentes de solo e status do sensor.

    Parametros:
        farm_id: Filtrar por fazenda
    """
    query = get_user_sensors_query(db, current_user)

    if farm_id:
        query = query.filter(Sensor.farm_id == farm_id)

    sensors = query.filter(Sensor.is_active == True).all()
    result = []

    for sensor in sensors:
        plot_name = None
        if sensor.plot_id:
            plot = db.query(Plot).filter(Plot.id == sensor.plot_id).first()
            if plot:
                plot_name = plot.name

        soil_reading = (
            db.query(SoilReading)
            .filter(SoilReading.sensor_id == sensor.id)
            .order_by(SoilReading.time.desc())
            .first()
        )

        metrics = {}
        is_critical = False

        if soil_reading:
            if soil_reading.moisture is not None:
                metrics["soilMoisture"] = float(soil_reading.moisture)
                if soil_reading.moisture < 15 or soil_reading.moisture > 40:
                    is_critical = True
            if soil_reading.temperature is not None:
                metrics["temperature"] = float(soil_reading.temperature)
                if soil_reading.temperature < 18 or soil_reading.temperature > 38:
                    is_critical = True
            if soil_reading.ec is not None:
                metrics["electricalConductivity"] = float(soil_reading.ec)
            if soil_reading.ph is not None:
                metrics["ph"] = float(soil_reading.ph)
                if soil_reading.ph < 5.5 or soil_reading.ph > 8:
                    is_critical = True
            if soil_reading.nitrogen is not None:
                metrics["nitrogen"] = float(soil_reading.nitrogen)
            if soil_reading.potassium is not None:
                metrics["potassium"] = float(soil_reading.potassium)
            if soil_reading.phosphorus is not None:
                metrics["phosphorus"] = float(soil_reading.phosphorus)

        result.append(
            SensorHeatmapData(
                sensor_id=sensor.id,
                sensor_name=sensor.name,
                plot_id=sensor.plot_id,
                plot_name=plot_name,
                location=sensor.location,
                is_online=sensor.is_online,
                last_signal_at=sensor.last_signal_at,
                metrics=metrics,
                is_critical=is_critical,
            )
        )

    return result


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
