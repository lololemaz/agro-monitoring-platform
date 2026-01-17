"""Rotas de talhoes."""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import CurrentUser
from app.database import get_db
from app.models.farm import Farm, Plot
from app.models.sensor import Sensor
from app.models.timeseries import SoilReading, VisionData
from app.schemas.plot import PlotCreate, PlotResponse, PlotUpdate
from app.schemas.timeseries import (
    PlotWithReadingsResponse,
    SoilReadingResponse,
    VisionDataResponse,
)

router = APIRouter()


def get_user_plots_query(db: Session, current_user):
    """Retorna query base para plots do usuário."""
    query = db.query(Plot).filter(Plot.deleted_at.is_(None))

    if not current_user.is_superuser:
        # Filtra por fazendas da organização do usuário
        query = query.join(Farm).filter(Farm.organization_id == current_user.organization_id)

    return query


@router.get("/", response_model=list[PlotResponse])
async def list_plots(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    farm_id: UUID | None = None,
):
    """Lista talhões.

    Opcionalmente filtra por fazenda.
    """
    query = get_user_plots_query(db, current_user)

    if farm_id:
        query = query.filter(Plot.farm_id == farm_id)

    return query.all()


@router.get("/{plot_id}", response_model=PlotResponse)
async def get_plot(
    plot_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Obtém um talhão específico."""
    query = get_user_plots_query(db, current_user)
    plot = query.filter(Plot.id == plot_id).first()

    if not plot:
        raise HTTPException(status_code=404, detail="Talhão não encontrado")

    return plot


@router.post("/", response_model=PlotResponse, status_code=status.HTTP_201_CREATED)
async def create_plot(
    plot_data: PlotCreate,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Cria um novo talhão."""
    # Verifica se fazenda existe e pertence à organização
    farm_query = db.query(Farm).filter(Farm.id == plot_data.farm_id, Farm.deleted_at.is_(None))

    if not current_user.is_superuser:
        farm_query = farm_query.filter(Farm.organization_id == current_user.organization_id)

    farm = farm_query.first()
    if not farm:
        raise HTTPException(status_code=404, detail="Fazenda não encontrada")

    plot = Plot(
        farm_id=plot_data.farm_id,
        name=plot_data.name,
        code=plot_data.code,
        area=plot_data.area,
        crop_type=plot_data.crop_type,
        variety=plot_data.variety,
        planting_date=plot_data.planting_date,
        season=plot_data.season,
        row_count=plot_data.row_count,
        tree_count=plot_data.tree_count,
        coordinates=plot_data.coordinates,
        grid_position=plot_data.grid_position,
        extra_data=plot_data.extra_data,
        created_by=current_user.id,
    )
    db.add(plot)
    db.commit()
    db.refresh(plot)
    return plot


@router.patch("/{plot_id}", response_model=PlotResponse)
async def update_plot(
    plot_id: UUID,
    plot_data: PlotUpdate,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Atualiza um talhão."""
    query = get_user_plots_query(db, current_user)
    plot = query.filter(Plot.id == plot_id).first()

    if not plot:
        raise HTTPException(status_code=404, detail="Talhão não encontrado")

    update_data = plot_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(plot, field, value)

    db.commit()
    db.refresh(plot)
    return plot


@router.delete("/{plot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plot(
    plot_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Remove um talhao (soft delete)."""
    query = get_user_plots_query(db, current_user)
    plot = query.filter(Plot.id == plot_id).first()

    if not plot:
        raise HTTPException(status_code=404, detail="Talhao nao encontrado")

    plot.deleted_at = datetime.now(timezone.utc)
    db.commit()


@router.get("/{plot_id}/soil-readings", response_model=list[SoilReadingResponse])
async def get_plot_soil_readings(
    plot_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    limit: int = Query(default=100, le=1000),
):
    """Obtem leituras de solo de um talhao.

    Parametros:
        start_time: Filtrar leituras a partir desta data
        end_time: Filtrar leituras ate esta data
        limit: Numero maximo de leituras (padrao: 100, max: 1000)
    """
    query = get_user_plots_query(db, current_user)
    plot = query.filter(Plot.id == plot_id).first()

    if not plot:
        raise HTTPException(status_code=404, detail="Talhao nao encontrado")

    readings_query = (
        db.query(SoilReading)
        .filter(SoilReading.plot_id == plot_id)
        .order_by(SoilReading.time.desc())
    )

    if start_time:
        readings_query = readings_query.filter(SoilReading.time >= start_time)
    if end_time:
        readings_query = readings_query.filter(SoilReading.time <= end_time)

    return readings_query.limit(limit).all()


@router.get("/{plot_id}/vision-data", response_model=list[VisionDataResponse])
async def get_plot_vision_data(
    plot_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    limit: int = Query(default=100, le=1000),
):
    """Obtem dados de visao computacional de um talhao.

    Parametros:
        start_time: Filtrar dados a partir desta data
        end_time: Filtrar dados ate esta data
        limit: Numero maximo de registros (padrao: 100, max: 1000)
    """
    query = get_user_plots_query(db, current_user)
    plot = query.filter(Plot.id == plot_id).first()

    if not plot:
        raise HTTPException(status_code=404, detail="Talhao nao encontrado")

    vision_query = (
        db.query(VisionData)
        .filter(VisionData.plot_id == plot_id)
        .order_by(VisionData.time.desc())
    )

    if start_time:
        vision_query = vision_query.filter(VisionData.time >= start_time)
    if end_time:
        vision_query = vision_query.filter(VisionData.time <= end_time)

    return vision_query.limit(limit).all()


def calculate_plot_status(soil: SoilReading | None, vision: VisionData | None) -> str:
    """Calcula status do talhao baseado nas leituras."""
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

    if vision:
        if vision.pests_detected:
            return "warning"
        if vision.irrigation_failures > 0:
            return "warning"
        stress = float(vision.water_stress_level) if vision.water_stress_level else 0
        if stress > 70:
            return "critical"

    return "ok"


def calculate_health_score(soil: SoilReading | None, vision: VisionData | None) -> int:
    """Calcula score de saude do talhao (0-100)."""
    if not soil:
        return 50

    score = 100

    moisture = float(soil.moisture) if soil.moisture else None
    ph = float(soil.ph) if soil.ph else None
    temp = float(soil.temperature) if soil.temperature else None

    if moisture is not None:
        if 18 <= moisture <= 28:
            pass
        elif 14 <= moisture <= 32:
            score -= 10
        else:
            score -= 25

    if ph is not None:
        if 6.0 <= ph <= 7.5:
            pass
        elif 5.5 <= ph <= 8.0:
            score -= 10
        else:
            score -= 25

    if temp is not None:
        if 18 <= temp <= 32:
            pass
        elif 15 <= temp <= 38:
            score -= 10
        else:
            score -= 20

    if vision:
        ndvi = float(vision.ndvi) if vision.ndvi else None
        if ndvi is not None:
            if ndvi >= 0.6:
                score += 10
            elif ndvi < 0.4:
                score -= 15

        if vision.pests_detected:
            score -= 15
        if vision.irrigation_failures > 0:
            score -= 10

    return max(0, min(100, score))


@router.get("/with-readings/", response_model=list[PlotWithReadingsResponse])
async def list_plots_with_readings(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    farm_id: UUID | None = None,
    include_readings: bool = True,
):
    """Lista talhoes com leituras atuais.

    Retorna os talhoes com a ultima leitura de solo e dados de visao,
    alem de status calculado e score de saude.
    """
    query = get_user_plots_query(db, current_user)

    if farm_id:
        query = query.filter(Plot.farm_id == farm_id)

    plots = query.all()
    result = []

    for plot in plots:
        soil_reading = None
        vision_data = None
        sensors_count = 0

        if include_readings:
            soil_reading = (
                db.query(SoilReading)
                .filter(SoilReading.plot_id == plot.id)
                .order_by(SoilReading.time.desc())
                .first()
            )

            vision_data = (
                db.query(VisionData)
                .filter(VisionData.plot_id == plot.id)
                .order_by(VisionData.time.desc())
                .first()
            )

            sensors_count = (
                db.query(Sensor)
                .filter(
                    Sensor.plot_id == plot.id,
                    Sensor.deleted_at.is_(None),
                    Sensor.is_active == True,
                )
                .count()
            )

        status = calculate_plot_status(soil_reading, vision_data)
        health_score = calculate_health_score(soil_reading, vision_data)

        estimated_yield = None
        if vision_data and vision_data.fruit_count and plot.tree_count:
            avg_fruit_weight = 0.35
            estimated_yield = vision_data.fruit_count * avg_fruit_weight

        result.append(
            PlotWithReadingsResponse(
                id=plot.id,
                farm_id=plot.farm_id,
                name=plot.name,
                code=plot.code,
                area=plot.area,
                crop_type=plot.crop_type,
                variety=plot.variety,
                planting_date=plot.planting_date,
                season=plot.season,
                row_count=plot.row_count,
                tree_count=plot.tree_count,
                coordinates=plot.coordinates,
                grid_position=plot.grid_position,
                extra_data=plot.extra_data or {},
                is_active=plot.is_active,
                created_at=plot.created_at,
                updated_at=plot.updated_at,
                status=status,
                health_score=health_score,
                current_soil_reading=soil_reading,
                current_vision_data=vision_data,
                sensors_count=sensors_count,
                estimated_yield=estimated_yield,
            )
        )

    return result
