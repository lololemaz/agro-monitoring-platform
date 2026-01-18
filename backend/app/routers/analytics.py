"""Rotas de analytics."""

from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import CurrentUser
from app.database import get_db
from app.models.alert import Alert
from app.models.analytics import PlotProductionSnapshot
from app.models.farm import Farm, Plot
from app.models.sensor import Sensor
from app.models.timeseries import SoilReading, VisionData
from app.schemas.analytics import (
    ForecastResponse,
    HistoricalDataPoint,
    HistoricalDataResponse,
    ProductionAnalyticsResponse,
    SnapshotCreate,
    SnapshotResponse,
)

router = APIRouter()


def get_user_plots_query(db: Session, current_user):
    """Retorna query base para plots do usuario."""
    query = db.query(Plot).filter(Plot.deleted_at.is_(None))

    if not current_user.is_superuser:
        query = query.join(Farm).filter(Farm.organization_id == current_user.organization_id)

    return query


@router.get("/", response_model=list[SnapshotResponse])
async def list_snapshots(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    farm_id: UUID | None = None,
    plot_id: UUID | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    production_stage: str | None = None,
    limit: int = Query(default=100, le=500),
):
    """Lista snapshots de producao.

    Parametros:
        farm_id: Filtrar por fazenda
        plot_id: Filtrar por talhao
        start_date: Data inicial
        end_date: Data final
        production_stage: Estagio de producao
        limit: Numero maximo de registros
    """
    plots_query = get_user_plots_query(db, current_user)

    if farm_id:
        plots_query = plots_query.filter(Plot.farm_id == farm_id)

    if plot_id:
        plots_query = plots_query.filter(Plot.id == plot_id)

    plot_ids = [p.id for p in plots_query.all()]

    if not plot_ids:
        return []

    snapshots_query = db.query(PlotProductionSnapshot).filter(
        PlotProductionSnapshot.plot_id.in_(plot_ids)
    )

    if start_date:
        snapshots_query = snapshots_query.filter(PlotProductionSnapshot.snapshot_date >= start_date)

    if end_date:
        snapshots_query = snapshots_query.filter(PlotProductionSnapshot.snapshot_date <= end_date)

    if production_stage:
        snapshots_query = snapshots_query.filter(
            PlotProductionSnapshot.production_stage == production_stage
        )

    snapshots = (
        snapshots_query.order_by(PlotProductionSnapshot.snapshot_date.desc())
        .limit(limit)
        .all()
    )

    result = []
    for snapshot in snapshots:
        plot = db.query(Plot).filter(Plot.id == snapshot.plot_id).first()
        result.append(
            SnapshotResponse(
                id=snapshot.id,
                plot_id=snapshot.plot_id,
                snapshot_date=snapshot.snapshot_date,
                status=snapshot.status,
                health_score=snapshot.health_score,
                production_stage=snapshot.production_stage,
                flowers_per_tree=snapshot.flowers_per_tree,
                total_flowers=snapshot.total_flowers,
                flowering_percentage=snapshot.flowering_percentage,
                fruits_per_tree=snapshot.fruits_per_tree,
                total_fruits=snapshot.total_fruits,
                avg_fruit_size=snapshot.avg_fruit_size,
                fruit_caliber=snapshot.fruit_caliber,
                estimated_yield_kg=snapshot.estimated_yield_kg,
                estimated_yield_tons=snapshot.estimated_yield_tons,
                harvest_start_date=snapshot.harvest_start_date,
                harvest_end_date=snapshot.harvest_end_date,
                days_to_harvest=snapshot.days_to_harvest,
                risk_level=snapshot.risk_level,
                risk_factors=snapshot.risk_factors or [],
                extra_data=snapshot.extra_data or {},
                last_soil_reading_id=snapshot.last_soil_reading_id,
                last_vision_data_id=snapshot.last_vision_data_id,
                created_at=snapshot.created_at,
                plot_name=plot.name if plot else None,
                plot_code=plot.code if plot else None,
            )
        )

    return result


@router.get("/latest", response_model=list[SnapshotResponse])
async def get_latest_snapshots(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    farm_id: UUID | None = None,
):
    """Obtem o ultimo snapshot de cada talhao.

    Parametros:
        farm_id: Filtrar por fazenda
    """
    plots_query = get_user_plots_query(db, current_user)

    if farm_id:
        plots_query = plots_query.filter(Plot.farm_id == farm_id)

    plots = plots_query.all()
    result = []

    for plot in plots:
        snapshot = (
            db.query(PlotProductionSnapshot)
            .filter(PlotProductionSnapshot.plot_id == plot.id)
            .order_by(PlotProductionSnapshot.snapshot_date.desc())
            .first()
        )

        if snapshot:
            result.append(
                SnapshotResponse(
                    id=snapshot.id,
                    plot_id=snapshot.plot_id,
                    snapshot_date=snapshot.snapshot_date,
                    status=snapshot.status,
                    health_score=snapshot.health_score,
                    production_stage=snapshot.production_stage,
                    flowers_per_tree=snapshot.flowers_per_tree,
                    total_flowers=snapshot.total_flowers,
                    flowering_percentage=snapshot.flowering_percentage,
                    fruits_per_tree=snapshot.fruits_per_tree,
                    total_fruits=snapshot.total_fruits,
                    avg_fruit_size=snapshot.avg_fruit_size,
                    fruit_caliber=snapshot.fruit_caliber,
                    estimated_yield_kg=snapshot.estimated_yield_kg,
                    estimated_yield_tons=snapshot.estimated_yield_tons,
                    harvest_start_date=snapshot.harvest_start_date,
                    harvest_end_date=snapshot.harvest_end_date,
                    days_to_harvest=snapshot.days_to_harvest,
                    risk_level=snapshot.risk_level,
                    risk_factors=snapshot.risk_factors or [],
                    extra_data=snapshot.extra_data or {},
                    last_soil_reading_id=snapshot.last_soil_reading_id,
                    last_vision_data_id=snapshot.last_vision_data_id,
                    created_at=snapshot.created_at,
                    plot_name=plot.name,
                    plot_code=plot.code,
                )
            )

    return result


@router.get("/production", response_model=ProductionAnalyticsResponse)
async def get_production_analytics(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    farm_id: UUID | None = None,
):
    """Obtem analytics de producao agregados."""
    plots_query = get_user_plots_query(db, current_user)

    if farm_id:
        plots_query = plots_query.filter(Plot.farm_id == farm_id)

    plots = plots_query.all()

    snapshots = []
    for plot in plots:
        snapshot = (
            db.query(PlotProductionSnapshot)
            .filter(PlotProductionSnapshot.plot_id == plot.id)
            .order_by(PlotProductionSnapshot.snapshot_date.desc())
            .first()
        )
        if snapshot:
            snapshots.append({
                "plot_id": str(plot.id),
                "plot_name": plot.name,
                "plot_code": plot.code,
                "snapshot": {
                    "id": str(snapshot.id),
                    "status": snapshot.status,
                    "health_score": float(snapshot.health_score) if snapshot.health_score else None,
                    "production_stage": snapshot.production_stage,
                    "total_fruits": snapshot.total_fruits,
                    "estimated_yield_kg": float(snapshot.estimated_yield_kg) if snapshot.estimated_yield_kg else 0,
                    "days_to_harvest": snapshot.days_to_harvest,
                    "risk_level": snapshot.risk_level,
                },
            })

    total_fruits = sum(s["snapshot"]["total_fruits"] or 0 for s in snapshots)
    total_yield_kg = sum(s["snapshot"]["estimated_yield_kg"] or 0 for s in snapshots)

    status_count = {"ok": 0, "warning": 0, "critical": 0, "offline": 0}
    for s in snapshots:
        status = s["snapshot"]["status"] or "ok"
        if status in status_count:
            status_count[status] += 1

    return ProductionAnalyticsResponse(
        total_plots=len(plots),
        plots_with_data=len(snapshots),
        total_fruits=total_fruits,
        estimated_yield_kg=total_yield_kg,
        estimated_yield_tons=total_yield_kg / 1000,
        status_summary=status_count,
        snapshots=snapshots,
    )


@router.get("/farm/{farm_id}/summary")
async def get_farm_analytics_summary(
    farm_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Obtem resumo de analytics de uma fazenda.

    Retorna estatisticas agregadas da fazenda.
    """
    farm_query = db.query(Farm).filter(Farm.id == farm_id, Farm.deleted_at.is_(None))

    if not current_user.is_superuser:
        farm_query = farm_query.filter(Farm.organization_id == current_user.organization_id)

    farm = farm_query.first()
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
        .filter(Alert.farm_id == farm_id, Alert.resolved_at.is_(None))
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
    total_yield_kg = 0.0

    for plot in plots:
        total_trees += plot.tree_count or 0

        snapshot = (
            db.query(PlotProductionSnapshot)
            .filter(PlotProductionSnapshot.plot_id == plot.id)
            .order_by(PlotProductionSnapshot.snapshot_date.desc())
            .first()
        )

        if snapshot:
            status = snapshot.status or "ok"
            if snapshot.estimated_yield_kg:
                total_yield_kg += float(snapshot.estimated_yield_kg)
        else:
            status = "offline"

        if status == "ok":
            plots_ok += 1
        elif status == "warning":
            plots_warning += 1
        elif status == "critical":
            plots_critical += 1
        else:
            plots_offline += 1

        soil_reading = (
            db.query(SoilReading)
            .filter(SoilReading.plot_id == plot.id)
            .order_by(SoilReading.time.desc())
            .first()
        )

        if soil_reading:
            if soil_reading.moisture is not None:
                moisture_values.append(float(soil_reading.moisture))
            if soil_reading.temperature is not None:
                temperature_values.append(float(soil_reading.temperature))
            if soil_reading.ph is not None:
                ph_values.append(float(soil_reading.ph))

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

    return {
        "farm_id": str(farm.id),
        "farm_name": farm.name,
        "total_area": float(farm.total_area) if farm.total_area else None,
        "total_plots": len(plots),
        "total_trees": total_trees,
        "total_sensors": len(sensors),
        "sensors_online": sensors_online,
        "sensors_offline": sensors_offline,
        "plots_ok": plots_ok,
        "plots_warning": plots_warning,
        "plots_critical": plots_critical,
        "plots_offline": plots_offline,
        "active_alerts": len(alerts),
        "critical_alerts": critical_alerts,
        "warning_alerts": warning_alerts,
        "avg_moisture": avg_moisture,
        "avg_temperature": avg_temperature,
        "avg_ph": avg_ph,
        "health_score": health_score,
        "estimated_yield_kg": total_yield_kg,
    }


@router.get("/farm/{farm_id}/forecast", response_model=ForecastResponse)
async def get_farm_forecast(
    farm_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Obtem previsao de producao de uma fazenda."""
    farm_query = db.query(Farm).filter(Farm.id == farm_id, Farm.deleted_at.is_(None))

    if not current_user.is_superuser:
        farm_query = farm_query.filter(Farm.organization_id == current_user.organization_id)

    farm = farm_query.first()
    if not farm:
        raise HTTPException(status_code=404, detail="Fazenda nao encontrada")

    plots = (
        db.query(Plot)
        .filter(Plot.farm_id == farm_id, Plot.deleted_at.is_(None), Plot.is_active == True)
        .all()
    )

    total_yield_kg = 0.0
    harvest_start = None
    harvest_end = None
    plots_ready = 0
    plots_in_progress = 0

    for plot in plots:
        snapshot = (
            db.query(PlotProductionSnapshot)
            .filter(PlotProductionSnapshot.plot_id == plot.id)
            .order_by(PlotProductionSnapshot.snapshot_date.desc())
            .first()
        )

        if snapshot:
            if snapshot.estimated_yield_kg:
                total_yield_kg += float(snapshot.estimated_yield_kg)

            if snapshot.harvest_start_date:
                if harvest_start is None or snapshot.harvest_start_date < harvest_start:
                    harvest_start = snapshot.harvest_start_date

            if snapshot.harvest_end_date:
                if harvest_end is None or snapshot.harvest_end_date > harvest_end:
                    harvest_end = snapshot.harvest_end_date

            if snapshot.production_stage == "pronto_colheita":
                plots_ready += 1
            elif snapshot.production_stage in ["maturacao", "crescimento", "frutificacao"]:
                plots_in_progress += 1

    return ForecastResponse(
        total_estimated_kg=total_yield_kg,
        total_estimated_tons=total_yield_kg / 1000,
        harvest_start=harvest_start,
        harvest_end=harvest_end,
        plots_ready=plots_ready,
        plots_in_progress=plots_in_progress,
    )


@router.get("/farm/{farm_id}/history", response_model=HistoricalDataResponse)
async def get_farm_history(
    farm_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    metric: str = Query(default="health_score"),
    period: str = Query(default="30d"),
):
    """Obtem dados historicos de uma fazenda para graficos.

    Parametros:
        metric: Metrica (health_score, yield, moisture, temperature)
        period: Periodo (7d, 30d, 90d, 1y)
    """
    farm_query = db.query(Farm).filter(Farm.id == farm_id, Farm.deleted_at.is_(None))

    if not current_user.is_superuser:
        farm_query = farm_query.filter(Farm.organization_id == current_user.organization_id)

    farm = farm_query.first()
    if not farm:
        raise HTTPException(status_code=404, detail="Fazenda nao encontrada")

    period_days = {"7d": 7, "30d": 30, "90d": 90, "1y": 365}.get(period, 30)
    start_date = date.today() - timedelta(days=period_days)

    plots = (
        db.query(Plot)
        .filter(Plot.farm_id == farm_id, Plot.deleted_at.is_(None))
        .all()
    )

    plot_ids = [p.id for p in plots]

    data_points = []

    if metric in ["health_score", "yield"]:
        snapshots = (
            db.query(PlotProductionSnapshot)
            .filter(
                PlotProductionSnapshot.plot_id.in_(plot_ids),
                PlotProductionSnapshot.snapshot_date >= start_date,
            )
            .order_by(PlotProductionSnapshot.snapshot_date)
            .all()
        )

        by_date = {}
        for snapshot in snapshots:
            date_str = snapshot.snapshot_date.isoformat()
            if date_str not in by_date:
                by_date[date_str] = []

            if metric == "health_score" and snapshot.health_score:
                by_date[date_str].append(float(snapshot.health_score))
            elif metric == "yield" and snapshot.estimated_yield_kg:
                by_date[date_str].append(float(snapshot.estimated_yield_kg))

        for date_str, values in sorted(by_date.items()):
            if values:
                avg_value = sum(values) / len(values) if metric == "health_score" else sum(values)
                data_points.append(HistoricalDataPoint(date=date_str, value=avg_value))

    elif metric in ["moisture", "temperature"]:
        start_datetime = datetime.combine(start_date, datetime.min.time()).replace(tzinfo=timezone.utc)

        readings = (
            db.query(SoilReading)
            .filter(
                SoilReading.plot_id.in_(plot_ids),
                SoilReading.time >= start_datetime,
            )
            .order_by(SoilReading.time)
            .all()
        )

        by_date = {}
        for reading in readings:
            date_str = reading.time.date().isoformat()
            if date_str not in by_date:
                by_date[date_str] = []

            value = None
            if metric == "moisture" and reading.moisture:
                value = float(reading.moisture)
            elif metric == "temperature" and reading.temperature:
                value = float(reading.temperature)

            if value is not None:
                by_date[date_str].append(value)

        for date_str, values in sorted(by_date.items()):
            if values:
                avg_value = sum(values) / len(values)
                data_points.append(HistoricalDataPoint(date=date_str, value=avg_value))

    return HistoricalDataResponse(
        metric=metric,
        period=period,
        data=data_points,
    )


@router.get("/plots/{plot_id}/snapshots", response_model=list[SnapshotResponse])
async def get_plot_snapshots(
    plot_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    limit: int = Query(default=30, le=100),
):
    """Obtem snapshots de producao de um talhao."""
    plot_query = db.query(Plot).filter(Plot.id == plot_id, Plot.deleted_at.is_(None))

    if not current_user.is_superuser:
        plot_query = plot_query.join(Farm).filter(
            Farm.organization_id == current_user.organization_id
        )

    plot = plot_query.first()
    if not plot:
        raise HTTPException(status_code=404, detail="Talhao nao encontrado")

    snapshots = (
        db.query(PlotProductionSnapshot)
        .filter(PlotProductionSnapshot.plot_id == plot_id)
        .order_by(PlotProductionSnapshot.snapshot_date.desc())
        .limit(limit)
        .all()
    )

    return [
        SnapshotResponse(
            id=snapshot.id,
            plot_id=snapshot.plot_id,
            snapshot_date=snapshot.snapshot_date,
            status=snapshot.status,
            health_score=snapshot.health_score,
            production_stage=snapshot.production_stage,
            flowers_per_tree=snapshot.flowers_per_tree,
            total_flowers=snapshot.total_flowers,
            flowering_percentage=snapshot.flowering_percentage,
            fruits_per_tree=snapshot.fruits_per_tree,
            total_fruits=snapshot.total_fruits,
            avg_fruit_size=snapshot.avg_fruit_size,
            fruit_caliber=snapshot.fruit_caliber,
            estimated_yield_kg=snapshot.estimated_yield_kg,
            estimated_yield_tons=snapshot.estimated_yield_tons,
            harvest_start_date=snapshot.harvest_start_date,
            harvest_end_date=snapshot.harvest_end_date,
            days_to_harvest=snapshot.days_to_harvest,
            risk_level=snapshot.risk_level,
            risk_factors=snapshot.risk_factors or [],
            extra_data=snapshot.extra_data or {},
            last_soil_reading_id=snapshot.last_soil_reading_id,
            last_vision_data_id=snapshot.last_vision_data_id,
            created_at=snapshot.created_at,
            plot_name=plot.name,
            plot_code=plot.code,
        )
        for snapshot in snapshots
    ]


@router.get("/{snapshot_id}", response_model=SnapshotResponse)
async def get_snapshot(
    snapshot_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Obtem um snapshot especifico."""
    snapshot = db.query(PlotProductionSnapshot).filter(
        PlotProductionSnapshot.id == snapshot_id
    ).first()

    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot nao encontrado")

    plot_query = db.query(Plot).filter(Plot.id == snapshot.plot_id, Plot.deleted_at.is_(None))

    if not current_user.is_superuser:
        plot_query = plot_query.join(Farm).filter(
            Farm.organization_id == current_user.organization_id
        )

    plot = plot_query.first()
    if not plot:
        raise HTTPException(status_code=404, detail="Snapshot nao encontrado")

    return SnapshotResponse(
        id=snapshot.id,
        plot_id=snapshot.plot_id,
        snapshot_date=snapshot.snapshot_date,
        status=snapshot.status,
        health_score=snapshot.health_score,
        production_stage=snapshot.production_stage,
        flowers_per_tree=snapshot.flowers_per_tree,
        total_flowers=snapshot.total_flowers,
        flowering_percentage=snapshot.flowering_percentage,
        fruits_per_tree=snapshot.fruits_per_tree,
        total_fruits=snapshot.total_fruits,
        avg_fruit_size=snapshot.avg_fruit_size,
        fruit_caliber=snapshot.fruit_caliber,
        estimated_yield_kg=snapshot.estimated_yield_kg,
        estimated_yield_tons=snapshot.estimated_yield_tons,
        harvest_start_date=snapshot.harvest_start_date,
        harvest_end_date=snapshot.harvest_end_date,
        days_to_harvest=snapshot.days_to_harvest,
        risk_level=snapshot.risk_level,
        risk_factors=snapshot.risk_factors or [],
        extra_data=snapshot.extra_data or {},
        last_soil_reading_id=snapshot.last_soil_reading_id,
        last_vision_data_id=snapshot.last_vision_data_id,
        created_at=snapshot.created_at,
        plot_name=plot.name,
        plot_code=plot.code,
    )


@router.post("/", response_model=SnapshotResponse, status_code=status.HTTP_201_CREATED)
async def create_snapshot(
    data: SnapshotCreate,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Cria um novo snapshot de producao."""
    plot_query = db.query(Plot).filter(Plot.id == data.plot_id, Plot.deleted_at.is_(None))

    if not current_user.is_superuser:
        plot_query = plot_query.join(Farm).filter(
            Farm.organization_id == current_user.organization_id
        )

    plot = plot_query.first()
    if not plot:
        raise HTTPException(status_code=404, detail="Talhao nao encontrado")

    existing = (
        db.query(PlotProductionSnapshot)
        .filter(
            PlotProductionSnapshot.plot_id == data.plot_id,
            PlotProductionSnapshot.snapshot_date == data.snapshot_date,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Ja existe um snapshot para este talhao nesta data",
        )

    snapshot = PlotProductionSnapshot(
        plot_id=data.plot_id,
        snapshot_date=data.snapshot_date,
        status=data.status,
        health_score=data.health_score,
        production_stage=data.production_stage,
        flowers_per_tree=data.flowers_per_tree,
        total_flowers=data.total_flowers,
        flowering_percentage=data.flowering_percentage,
        fruits_per_tree=data.fruits_per_tree,
        total_fruits=data.total_fruits,
        avg_fruit_size=data.avg_fruit_size,
        fruit_caliber=data.fruit_caliber,
        estimated_yield_kg=data.estimated_yield_kg,
        estimated_yield_tons=data.estimated_yield_tons,
        harvest_start_date=data.harvest_start_date,
        harvest_end_date=data.harvest_end_date,
        days_to_harvest=data.days_to_harvest,
        risk_level=data.risk_level,
        risk_factors=data.risk_factors or [],
        last_soil_reading_id=data.last_soil_reading_id,
        last_vision_data_id=data.last_vision_data_id,
        extra_data=data.extra_data or {},
    )

    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)

    return SnapshotResponse(
        id=snapshot.id,
        plot_id=snapshot.plot_id,
        snapshot_date=snapshot.snapshot_date,
        status=snapshot.status,
        health_score=snapshot.health_score,
        production_stage=snapshot.production_stage,
        flowers_per_tree=snapshot.flowers_per_tree,
        total_flowers=snapshot.total_flowers,
        flowering_percentage=snapshot.flowering_percentage,
        fruits_per_tree=snapshot.fruits_per_tree,
        total_fruits=snapshot.total_fruits,
        avg_fruit_size=snapshot.avg_fruit_size,
        fruit_caliber=snapshot.fruit_caliber,
        estimated_yield_kg=snapshot.estimated_yield_kg,
        estimated_yield_tons=snapshot.estimated_yield_tons,
        harvest_start_date=snapshot.harvest_start_date,
        harvest_end_date=snapshot.harvest_end_date,
        days_to_harvest=snapshot.days_to_harvest,
        risk_level=snapshot.risk_level,
        risk_factors=snapshot.risk_factors or [],
        extra_data=snapshot.extra_data or {},
        last_soil_reading_id=snapshot.last_soil_reading_id,
        last_vision_data_id=snapshot.last_vision_data_id,
        created_at=snapshot.created_at,
        plot_name=plot.name,
        plot_code=plot.code,
    )


@router.post("/generate", response_model=list[SnapshotResponse])
async def generate_snapshots_from_sensors(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    farm_id: UUID | None = None,
):
    """Gera ou atualiza snapshots baseado nos dados de sensores.
    
    Este endpoint analisa os dados de soil_readings e vision_data
    para criar ou atualizar snapshots de producao para cada talhao.
    Se ja existir um snapshot para hoje, ele sera atualizado com os dados mais recentes.
    """
    from decimal import Decimal
    
    plots_query = get_user_plots_query(db, current_user)
    
    if farm_id:
        plots_query = plots_query.filter(Plot.farm_id == farm_id)
    
    plots = plots_query.all()
    today = date.today()
    created_snapshots = []
    
    for plot_item in plots:
        # Verificar se ja existe snapshot para hoje
        existing = (
            db.query(PlotProductionSnapshot)
            .filter(
                PlotProductionSnapshot.plot_id == plot_item.id,
                PlotProductionSnapshot.snapshot_date == today,
            )
            .first()
        )
        
        # Buscar ultima leitura de solo
        last_soil = (
            db.query(SoilReading)
            .filter(SoilReading.plot_id == plot_item.id)
            .order_by(SoilReading.time.desc())
            .first()
        )
        
        # Buscar ultima leitura de visao
        last_vision = (
            db.query(VisionData)
            .filter(VisionData.plot_id == plot_item.id)
            .order_by(VisionData.time.desc())
            .first()
        )
        
        # Calcular health score baseado nas leituras
        health_score = Decimal("70")  # Base
        risk_factors = []
        plot_status = "ok"
        
        if last_soil:
            # Ajustar health score baseado em umidade
            moisture = float(last_soil.moisture or 0)
            if moisture < 15:
                health_score -= Decimal("15")
                risk_factors.append("Umidade do solo baixa")
                plot_status = "warning"
            elif moisture > 35:
                health_score -= Decimal("10")
                risk_factors.append("Umidade do solo alta")
            
            # Ajustar baseado em pH
            ph = float(last_soil.ph or 6.5)
            if ph < 5.5 or ph > 7.5:
                health_score -= Decimal("10")
                risk_factors.append("pH fora da faixa ideal")
                if plot_status == "ok":
                    plot_status = "warning"
            
            # Ajustar baseado em temperatura
            temp = float(last_soil.temperature or 25)
            if temp > 35:
                health_score -= Decimal("15")
                risk_factors.append("Temperatura elevada")
                plot_status = "critical"
            elif temp < 15:
                health_score -= Decimal("10")
                risk_factors.append("Temperatura baixa")
        
        # Dados de visao
        total_fruits = 0
        avg_fruit_size = None
        flowering_percentage = None
        
        if last_vision:
            total_fruits = last_vision.fruit_count or 0
            avg_fruit_size = last_vision.avg_fruit_size
            flowering_percentage = last_vision.flowering_percentage
            
            # Ajustar health score baseado em estresse hidrico
            water_stress = float(last_vision.water_stress_level or 0)
            if water_stress > 60:
                health_score -= Decimal("20")
                risk_factors.append("Estresse hidrico alto")
                plot_status = "critical"
            elif water_stress > 40:
                health_score -= Decimal("10")
                risk_factors.append("Estresse hidrico moderado")
                if plot_status == "ok":
                    plot_status = "warning"
        
        # Garantir que health_score esta entre 0 e 100
        health_score = max(Decimal("0"), min(Decimal("100"), health_score))
        
        # Determinar risk level
        risk_level = "baixo"
        if len(risk_factors) >= 3 or plot_status == "critical":
            risk_level = "critico"
        elif len(risk_factors) >= 2:
            risk_level = "alto"
        elif len(risk_factors) >= 1:
            risk_level = "medio"
        
        # Estimar producao (simplificado)
        tree_count = plot_item.tree_count or 100
        fruits_per_tree = total_fruits / tree_count if tree_count > 0 else 0
        avg_weight_kg = 0.35  # Peso medio de uma manga em kg
        estimated_yield_kg = Decimal(str(total_fruits * avg_weight_kg))
        estimated_yield_tons = estimated_yield_kg / 1000
        
        # Determinar estagio de producao
        production_stage = "vegetativo"
        if flowering_percentage and float(flowering_percentage) > 50:
            production_stage = "floracao"
        elif total_fruits > tree_count * 5:
            production_stage = "frutificacao"
        elif total_fruits > tree_count * 20:
            production_stage = "maturacao"
        
        if existing:
            # Atualizar snapshot existente
            existing.status = plot_status
            existing.health_score = health_score
            existing.production_stage = production_stage
            existing.fruits_per_tree = Decimal(str(fruits_per_tree)) if fruits_per_tree else None
            existing.total_fruits = total_fruits
            existing.avg_fruit_size = avg_fruit_size
            existing.estimated_yield_kg = estimated_yield_kg
            existing.estimated_yield_tons = estimated_yield_tons
            existing.flowering_percentage = flowering_percentage
            existing.risk_level = risk_level
            existing.risk_factors = risk_factors
            created_snapshots.append((existing, plot_item))
        else:
            # Criar novo snapshot
            new_snapshot = PlotProductionSnapshot(
                plot_id=plot_item.id,
                snapshot_date=today,
                status=plot_status,
                health_score=health_score,
                production_stage=production_stage,
                fruits_per_tree=Decimal(str(fruits_per_tree)) if fruits_per_tree else None,
                total_fruits=total_fruits,
                avg_fruit_size=avg_fruit_size,
                estimated_yield_kg=estimated_yield_kg,
                estimated_yield_tons=estimated_yield_tons,
                flowering_percentage=flowering_percentage,
                risk_level=risk_level,
                risk_factors=risk_factors,
            )
            db.add(new_snapshot)
            created_snapshots.append((new_snapshot, plot_item))
    
    db.commit()
    
    # Preparar resposta
    result = []
    for snap, p in created_snapshots:
        db.refresh(snap)
        result.append(
            SnapshotResponse(
                id=snap.id,
                plot_id=snap.plot_id,
                snapshot_date=snap.snapshot_date,
                status=snap.status,
                health_score=snap.health_score,
                production_stage=snap.production_stage,
                flowers_per_tree=snap.flowers_per_tree,
                total_flowers=snap.total_flowers,
                flowering_percentage=snap.flowering_percentage,
                fruits_per_tree=snap.fruits_per_tree,
                total_fruits=snap.total_fruits,
                avg_fruit_size=snap.avg_fruit_size,
                fruit_caliber=snap.fruit_caliber,
                estimated_yield_kg=snap.estimated_yield_kg,
                estimated_yield_tons=snap.estimated_yield_tons,
                harvest_start_date=snap.harvest_start_date,
                harvest_end_date=snap.harvest_end_date,
                days_to_harvest=snap.days_to_harvest,
                risk_level=snap.risk_level,
                risk_factors=snap.risk_factors or [],
                extra_data=snap.extra_data or {},
                last_soil_reading_id=snap.last_soil_reading_id,
                last_vision_data_id=snap.last_vision_data_id,
                created_at=snap.created_at,
                plot_name=p.name,
                plot_code=p.code,
            )
        )
    
    return result
