"""Rotas de autenticação."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.deps import CurrentUser
from app.core.security import create_access_token, verify_password
from app.database import get_db
from app.schemas.auth import LoginRequest, PasswordChange, Token
from app.schemas.user import UserResponse
from app.services.user_service import UserService

router = APIRouter()


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Login do usuário.

    Autentica o usuário e retorna um token JWT.
    """
    user_service = UserService(db)
    user = user_service.authenticate(form_data.username, form_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo",
        )

    # Atualiza último login
    user_service.update_last_login(user)

    # Gera token
    access_token = create_access_token(data={"sub": str(user.id)})

    return Token(access_token=access_token)


@router.post("/login/json", response_model=Token)
async def login_json(
    login_data: LoginRequest,
    db: Session = Depends(get_db),
):
    """Login do usuário (JSON).

    Alternativa ao login OAuth2 para clientes que preferem JSON.
    """
    user_service = UserService(db)
    user = user_service.authenticate(login_data.email, login_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo",
        )

    # Atualiza último login
    user_service.update_last_login(user)

    # Gera token
    access_token = create_access_token(data={"sub": str(user.id)})

    return Token(access_token=access_token)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: CurrentUser):
    """Retorna informações do usuário autenticado."""
    return current_user


@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    """Altera a senha do usuário autenticado."""
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha atual incorreta",
        )

    user_service = UserService(db)
    user_service.change_password(current_user, password_data.new_password)

    return {"message": "Senha alterada com sucesso"}
