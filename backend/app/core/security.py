"""Funções de segurança - hashing e JWT."""

from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from jose import JWTError, jwt

from app.config import settings

# Constantes
ALGORITHM = settings.algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    """Cria um token JWT de acesso."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> dict[str, Any] | None:
    """Verifica e decodifica um token JWT."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha está correta."""
    try:
        password_bytes = plain_password.encode("utf-8")
        # Garante que hashed_password é uma string
        if isinstance(hashed_password, bytes):
            hashed_bytes = hashed_password
        else:
            hashed_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except (ValueError, TypeError, AttributeError) as e:
        # Log do erro em produção para debug
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Erro ao verificar senha: {e}, tipo: {type(hashed_password)}")
        return False


def get_password_hash(password: str) -> str:
    """Gera hash da senha."""
    # Garante que a senha é uma string
    if not isinstance(password, str):
        raise ValueError("A senha deve ser uma string")
    
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    
    # Garante que o resultado é uma string UTF-8 válida
    if isinstance(hashed, bytes):
        return hashed.decode("utf-8")
    return str(hashed)
