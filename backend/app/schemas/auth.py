"""Schemas de autenticação."""

from pydantic import BaseModel, EmailStr


class Token(BaseModel):
    """Resposta do token de acesso."""

    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Payload do token JWT."""

    sub: str | None = None


class LoginRequest(BaseModel):
    """Requisição de login."""

    email: EmailStr
    password: str


class PasswordChange(BaseModel):
    """Requisição de troca de senha."""

    current_password: str
    new_password: str


class PasswordReset(BaseModel):
    """Requisição de reset de senha (por admin/owner)."""

    new_password: str
