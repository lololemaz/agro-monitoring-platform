"""Rotas de fazendas."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import CurrentUser
from app.database import get_db
from app.models.farm import Farm
from app.schemas.farm import FarmCreate, FarmResponse, FarmUpdate

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
    from datetime import datetime, timezone

    query = db.query(Farm).filter(Farm.id == farm_id, Farm.deleted_at.is_(None))

    if not current_user.is_superuser:
        query = query.filter(Farm.organization_id == current_user.organization_id)

    farm = query.first()

    if not farm:
        raise HTTPException(status_code=404, detail="Fazenda não encontrada")

    farm.deleted_at = datetime.now(timezone.utc)
    db.commit()
