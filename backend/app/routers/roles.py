"""Rotas de cargos/roles."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.core.deps import CurrentOrgOwner, CurrentUser
from app.database import get_db
from app.models.organization import Role

router = APIRouter()


class RoleResponse(BaseModel):
    """Schema de resposta de role."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID | None = None
    name: str
    slug: str
    description: str | None = None
    is_system_role: bool
    permissions: list = []


@router.get("/", response_model=list[RoleResponse])
async def list_roles(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Lista roles disponiveis para a organizacao.

    Inclui roles de sistema e roles customizados da organizacao.
    """
    query = db.query(Role)

    if current_user.is_superuser:
        query = query.filter(Role.is_system_role == True)
    else:
        query = query.filter(
            (Role.organization_id == current_user.organization_id)
            | (Role.is_system_role == True)
        )

    return query.all()


@router.get("/{role_id}", response_model=RoleResponse)
async def get_role(
    role_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Obtem detalhes de um role."""
    role = db.query(Role).filter(Role.id == role_id).first()

    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role nao encontrado",
        )

    if not current_user.is_superuser:
        if role.organization_id and role.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sem permissao para acessar este role",
            )

    return role
