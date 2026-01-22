"""Rotas de administração do sistema (superuser only)."""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import CurrentSuperuser
from app.database import get_db
from app.models.farm import Farm, Plot
from app.models.sensor import Sensor, SensorType
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationResponse,
    OrganizationUpdate,
    OrganizationWithOwner,
)
from app.schemas.sensor import SensorCreate, SensorResponse, SensorUpdate
from app.schemas.sensor_type import (
    SensorTypeCreate,
    SensorTypeResponse,
    SensorTypeUpdate,
)
from app.schemas.auth import PasswordReset
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
            org_data.owner_first_name = owner.first_name
            org_data.owner_last_name = owner.last_name
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
    result.owner_first_name = owner.first_name
    result.owner_last_name = owner.last_name

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
        result.owner_first_name = owner.first_name
        result.owner_last_name = owner.last_name

    return result


@router.patch("/organizations/{org_id}", response_model=OrganizationWithOwner)
async def update_organization(
    org_id: UUID,
    org_data: OrganizationUpdate,
    current_user: CurrentSuperuser,
    db: Session = Depends(get_db),
):
    """Atualiza uma organização e dados do owner."""
    org_service = OrganizationService(db)
    organization = org_service.get_by_id(org_id)

    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organização não encontrada",
        )

    try:
        updated_org = org_service.update(organization, org_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    
    owner = org_service.get_owner(updated_org)
    result = OrganizationWithOwner.model_validate(updated_org)
    if owner:
        result.owner_id = owner.id
        result.owner_email = owner.email
        result.owner_first_name = owner.first_name
        result.owner_last_name = owner.last_name
    
    return result


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


# ==================== Sensores ====================


@router.get("/sensors", response_model=list[SensorResponse])
async def list_all_sensors(
    current_user: CurrentSuperuser,
    db: Session = Depends(get_db),
    organization_id: UUID | None = None,
    farm_id: UUID | None = None,
):
    """Lista sensores de todas organizacoes ou filtrado por organizacao/fazenda.

    Apenas superusers podem acessar.
    """
    query = db.query(Sensor).filter(Sensor.deleted_at.is_(None))

    if organization_id:
        query = query.filter(Sensor.organization_id == organization_id)
    if farm_id:
        query = query.filter(Sensor.farm_id == farm_id)

    return query.all()


@router.post("/sensors", response_model=SensorResponse, status_code=status.HTTP_201_CREATED)
async def create_sensor(
    sensor_data: SensorCreate,
    organization_id: UUID,
    current_user: CurrentSuperuser,
    db: Session = Depends(get_db),
):
    """Cria um novo sensor para uma organizacao.

    Apenas superusers podem criar sensores.
    O organization_id e obrigatorio.
    """

    org_service = OrganizationService(db)
    organization = org_service.get_by_id(organization_id)

    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organizacao nao encontrada",
        )

    if sensor_data.farm_id:
        farm = db.query(Farm).filter(
            Farm.id == sensor_data.farm_id,
            Farm.organization_id == organization_id,
        ).first()
        if not farm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Fazenda nao encontrada ou nao pertence a organizacao",
            )

    if sensor_data.plot_id:
        plot = db.query(Plot).filter(Plot.id == sensor_data.plot_id).first()
        if not plot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Talhao nao encontrado",
            )

    sensor_type = db.query(SensorType).filter(
        SensorType.id == sensor_data.sensor_type_id
    ).first()
    if not sensor_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tipo de sensor nao encontrado",
        )

    if sensor_data.dev_eui:
        existing = db.query(Sensor).filter(
            Sensor.dev_eui == sensor_data.dev_eui,
            Sensor.deleted_at.is_(None),
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ja existe um sensor com este DevEUI",
            )

    sensor = Sensor(
        organization_id=organization_id,
        farm_id=sensor_data.farm_id,
        plot_id=sensor_data.plot_id,
        sensor_type_id=sensor_data.sensor_type_id,
        name=sensor_data.name,
        dev_eui=sensor_data.dev_eui,
        serial_number=sensor_data.serial_number,
        mac_address=sensor_data.mac_address,
        location=sensor_data.location,
        installation_date=sensor_data.installation_date,
        firmware_version=sensor_data.firmware_version,
        configuration=sensor_data.configuration,
        created_by=current_user.id,
    )

    db.add(sensor)
    db.commit()
    db.refresh(sensor)

    return sensor


@router.get("/sensors/{sensor_id}", response_model=SensorResponse)
async def get_sensor(
    sensor_id: UUID,
    current_user: CurrentSuperuser,
    db: Session = Depends(get_db),
):
    """Obtem detalhes de um sensor."""
    sensor = db.query(Sensor).filter(
        Sensor.id == sensor_id,
        Sensor.deleted_at.is_(None),
    ).first()

    if not sensor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sensor nao encontrado",
        )

    return sensor


@router.patch("/sensors/{sensor_id}", response_model=SensorResponse)
async def update_sensor(
    sensor_id: UUID,
    sensor_data: SensorUpdate,
    current_user: CurrentSuperuser,
    db: Session = Depends(get_db),
):
    """Atualiza um sensor."""
    sensor = db.query(Sensor).filter(
        Sensor.id == sensor_id,
        Sensor.deleted_at.is_(None),
    ).first()

    if not sensor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sensor nao encontrado",
        )

    if sensor_data.dev_eui and sensor_data.dev_eui != sensor.dev_eui:
        existing = db.query(Sensor).filter(
            Sensor.dev_eui == sensor_data.dev_eui,
            Sensor.deleted_at.is_(None),
            Sensor.id != sensor_id,
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ja existe um sensor com este DevEUI",
            )

    update_data = sensor_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(sensor, field, value)

    db.commit()
    db.refresh(sensor)

    return sensor


@router.delete("/sensors/{sensor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sensor(
    sensor_id: UUID,
    current_user: CurrentSuperuser,
    db: Session = Depends(get_db),
):
    """Remove um sensor (soft delete)."""
    sensor = db.query(Sensor).filter(
        Sensor.id == sensor_id,
        Sensor.deleted_at.is_(None),
    ).first()

    if not sensor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sensor nao encontrado",
        )

    sensor.deleted_at = datetime.now(timezone.utc)
    db.commit()


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


@router.post("/users/{user_id}/reset-password")
async def admin_reset_user_password(
    user_id: UUID,
    password_data: PasswordReset,
    current_user: CurrentSuperuser,
    db: Session = Depends(get_db),
):
    """Reseta a senha de qualquer usuário (incluindo owners).

    Apenas superusers podem usar este endpoint.
    Permite resetar a senha de owners de organizações.
    """
    user_service = UserService(db)
    user = user_service.get_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )

    # Valida tamanho mínimo da senha
    if len(password_data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A senha deve ter no mínimo 8 caracteres",
        )

    user_service.change_password(user, password_data.new_password)

    return {"message": "Senha redefinida com sucesso"}
