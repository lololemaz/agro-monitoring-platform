"""Rotas de talhões."""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import CurrentUser
from app.database import get_db
from app.models.farm import Farm, Plot
from app.schemas.plot import PlotCreate, PlotResponse, PlotUpdate

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
    """Remove um talhão (soft delete)."""
    query = get_user_plots_query(db, current_user)
    plot = query.filter(Plot.id == plot_id).first()

    if not plot:
        raise HTTPException(status_code=404, detail="Talhão não encontrado")

    plot.deleted_at = datetime.now(timezone.utc)
    db.commit()
