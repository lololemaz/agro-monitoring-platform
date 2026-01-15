"""Rotas de administração do sistema (superuser only)."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import CurrentSuperuser
from app.database import get_db
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationResponse,
    OrganizationUpdate,
    OrganizationWithOwner,
)
from app.schemas.sensor_type import (
    SensorTypeCreate,
    SensorTypeResponse,
    SensorTypeUpdate,
)
from app.schemas.user import SuperUserCreate, UserResponse
from app.services.organization_service import OrganizationService
from app.services.sensor_type_service import SensorTypeService
from app.services.user_service import UserService

router = APIRouter()


# ==================== Organizações ====================


@router.get("/organizations", response_model=list[OrganizationWithOwner])
async def list_organizations(
    current_user: CurrentSuperuser,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    """Lista todas as organizações.

    Apenas superusers podem acessar.
    """
    org_service = OrganizationService(db)
    organizations = org_service.get_all(skip=skip, limit=limit)

    result = []
    for org in organizations:
        owner = org_service.get_owner(org)
        org_data = OrganizationWithOwner.model_validate(org)
        if owner:
            org_data.owner_id = owner.id
            org_data.owner_email = owner.email
        result.append(org_data)

    return result


@router.post("/organizations", response_model=OrganizationWithOwner, status_code=status.HTTP_201_CREATED)
async def create_organization(
    org_data: OrganizationCreate,
    current_user: CurrentSuperuser,
    db: Session = Depends(get_db),
):
    """Cria uma nova organização com seu owner.

    Apenas superusers podem criar organizações.
    """
    org_service = OrganizationService(db)
    user_service = UserService(db)

    # Verifica se documento já existe
    if org_data.document:
        existing = org_service.get_by_document(org_data.document)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Já existe uma organização com este documento",
            )

    # Verifica se email do owner já existe
    existing_user = user_service.get_by_email_any_org(org_data.owner_email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email do owner já está em uso",
        )

    organization, owner = org_service.create(org_data)

    result = OrganizationWithOwner.model_validate(organization)
    result.owner_id = owner.id
    result.owner_email = owner.email

    return result


@router.get("/organizations/{org_id}", response_model=OrganizationWithOwner)
async def get_organization(
    org_id: UUID,
    current_user: CurrentSuperuser,
    db: Session = Depends(get_db),
):
    """Obtém detalhes de uma organização."""
    org_service = OrganizationService(db)
    organization = org_service.get_by_id(org_id)

    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organização não encontrada",
        )

    owner = org_service.get_owner(organization)
    result = OrganizationWithOwner.model_validate(organization)
    if owner:
        result.owner_id = owner.id
        result.owner_email = owner.email

    return result


@router.patch("/organizations/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: UUID,
    org_data: OrganizationUpdate,
    current_user: CurrentSuperuser,
    db: Session = Depends(get_db),
):
    """Atualiza uma organização."""
    org_service = OrganizationService(db)
    organization = org_service.get_by_id(org_id)

    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organização não encontrada",
        )

    return org_service.update(organization, org_data)


@router.delete("/organizations/{org_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_organization(
    org_id: UUID,
    current_user: CurrentSuperuser,
    db: Session = Depends(get_db),
):
    """Remove uma organização (soft delete)."""
    org_service = OrganizationService(db)
    organization = org_service.get_by_id(org_id)

    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organização não encontrada",
        )

    org_service.delete(organization)


# ==================== Tipos de Sensor ====================


@router.get("/sensor-types", response_model=list[SensorTypeResponse])
async def list_sensor_types(
    current_user: CurrentSuperuser,
    db: Session = Depends(get_db),
):
    """Lista todos os tipos de sensor globais.

    Apenas superusers podem gerenciar tipos de sensor globais.
    """
    sensor_type_service = SensorTypeService(db)
    return sensor_type_service.get_all_global()


@router.post("/sensor-types", response_model=SensorTypeResponse, status_code=status.HTTP_201_CREATED)
async def create_sensor_type(
    sensor_type_data: SensorTypeCreate,
    current_user: CurrentSuperuser,
    db: Session = Depends(get_db),
):
    """Cria um novo tipo de sensor global.

    Tipos globais ficam disponíveis para todas as organizações.
    """
    sensor_type_service = SensorTypeService(db)

    # Verifica se slug já existe
    existing = sensor_type_service.get_by_slug(sensor_type_data.slug)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um tipo de sensor com este slug",
        )

    return sensor_type_service.create_global(sensor_type_data)


@router.get("/sensor-types/{sensor_type_id}", response_model=SensorTypeResponse)
async def get_sensor_type(
    sensor_type_id: UUID,
    current_user: CurrentSuperuser,
    db: Session = Depends(get_db),
):
    """Obtém detalhes de um tipo de sensor."""
    sensor_type_service = SensorTypeService(db)
    sensor_type = sensor_type_service.get_by_id(sensor_type_id)

    if not sensor_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tipo de sensor não encontrado",
        )

    return sensor_type


@router.patch("/sensor-types/{sensor_type_id}", response_model=SensorTypeResponse)
async def update_sensor_type(
    sensor_type_id: UUID,
    sensor_type_data: SensorTypeUpdate,
    current_user: CurrentSuperuser,
    db: Session = Depends(get_db),
):
    """Atualiza um tipo de sensor."""
    sensor_type_service = SensorTypeService(db)
    sensor_type = sensor_type_service.get_by_id(sensor_type_id)

    if not sensor_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tipo de sensor não encontrado",
        )

    return sensor_type_service.update(sensor_type, sensor_type_data)


@router.delete("/sensor-types/{sensor_type_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sensor_type(
    sensor_type_id: UUID,
    current_user: CurrentSuperuser,
    db: Session = Depends(get_db),
):
    """Desativa um tipo de sensor."""
    sensor_type_service = SensorTypeService(db)
    sensor_type = sensor_type_service.get_by_id(sensor_type_id)

    if not sensor_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tipo de sensor não encontrado",
        )

    sensor_type_service.delete(sensor_type)


# ==================== Super Users ====================


@router.post("/superusers", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_superuser(
    user_data: SuperUserCreate,
    current_user: CurrentSuperuser,
    db: Session = Depends(get_db),
):
    """Cria um novo superusuário.

    Apenas superusers podem criar outros superusers.
    """
    user_service = UserService(db)

    # Verifica se email já existe
    existing = user_service.get_by_email(user_data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já está em uso",
        )

    return user_service.create_superuser(user_data)
