"""Rotas de gestão de usuários da organização."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import CurrentOrgOwner, CurrentUser
from app.database import get_db
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services.user_service import UserService

router = APIRouter()


@router.get("/", response_model=list[UserResponse])
async def list_users(
    current_user: CurrentOrgOwner,
    db: Session = Depends(get_db),
):
    """Lista usuários da organização.

    Apenas owners da organização podem listar todos os usuários.
    """
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Superusers não pertencem a uma organização",
        )

    user_service = UserService(db)
    return user_service.get_users_by_organization(current_user.organization_id)


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    current_user: CurrentOrgOwner,
    db: Session = Depends(get_db),
):
    """Cria um novo usuário na organização.

    Apenas owners podem criar usuários.
    """
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Superusers não podem criar usuários em organizações",
        )

    user_service = UserService(db)

    # Verifica se email já existe na organização
    existing = user_service.get_by_email(user_data.email, current_user.organization_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já está em uso nesta organização",
        )

    return user_service.create_user(
        user_data,
        organization_id=current_user.organization_id,
        created_by=current_user.id,
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Obtém detalhes de um usuário.

    Usuários podem ver seus próprios dados.
    Owners podem ver dados de qualquer usuário da organização.
    """
    user_service = UserService(db)
    user = user_service.get_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )

    # Verifica permissão
    if user.id != current_user.id:
        if not current_user.is_superuser and not current_user.is_org_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sem permissão para acessar este usuário",
            )
        # Owner só pode ver usuários da mesma organização
        if current_user.is_org_owner and user.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuário não pertence à sua organização",
            )

    return user


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Atualiza dados de um usuário.

    Usuários podem atualizar seus próprios dados (exceto is_active).
    Owners podem atualizar qualquer usuário da organização.
    """
    user_service = UserService(db)
    user = user_service.get_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )

    # Verifica permissão
    is_self = user.id == current_user.id
    is_owner_of_user = (
        current_user.is_org_owner
        and user.organization_id == current_user.organization_id
    )

    if not is_self and not is_owner_of_user and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sem permissão para atualizar este usuário",
        )

    # Usuários normais não podem alterar is_active
    if is_self and not current_user.is_org_owner and user_data.is_active is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não pode alterar seu próprio status",
        )

    return user_service.update_user(user, user_data)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    current_user: CurrentOrgOwner,
    db: Session = Depends(get_db),
):
    """Remove um usuário (soft delete).

    Apenas owners podem remover usuários.
    Owners não podem remover a si mesmos.
    """
    user_service = UserService(db)
    user = user_service.get_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )

    # Não pode deletar a si mesmo
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você não pode remover sua própria conta",
        )

    # Owner só pode deletar usuários da mesma organização
    if not current_user.is_superuser:
        if user.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuário não pertence à sua organização",
            )

    user_service.delete_user(user)
