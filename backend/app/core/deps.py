"""Dependencies para injeção nas rotas."""

from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import verify_token
from app.database import get_db
from app.models.organization import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Session = Depends(get_db),
) -> User:
    """Obtém o usuário atual a partir do token JWT."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = verify_token(token)
    if payload is None:
        raise credentials_exception

    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = db.query(User).filter(
        User.id == UUID(user_id),
        User.deleted_at.is_(None),
    ).first()

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo",
        )

    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Verifica se o usuário está ativo."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo",
        )
    return current_user


async def get_current_superuser(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Verifica se o usuário é superuser."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores",
        )
    return current_user


async def get_current_org_owner(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Verifica se o usuário é owner da organização."""
    if not current_user.is_superuser and not current_user.is_org_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a proprietários da organização",
        )
    return current_user


def get_organization_id(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UUID | None:
    """Obtém o ID da organização do usuário atual."""
    return current_user.organization_id


# Type aliases para uso nas rotas
CurrentUser = Annotated[User, Depends(get_current_user)]
CurrentActiveUser = Annotated[User, Depends(get_current_active_user)]
CurrentSuperuser = Annotated[User, Depends(get_current_superuser)]
CurrentOrgOwner = Annotated[User, Depends(get_current_org_owner)]
