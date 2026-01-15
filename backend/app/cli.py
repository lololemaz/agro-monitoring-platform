"""CLI commands para gerenciamento da aplicação."""

import sys

from app.core.security import get_password_hash
from app.database import SessionLocal
from app.models.organization import User


def create_superuser(email: str, password: str, first_name: str | None = None):
    """Cria um superusuário inicial."""
    db = SessionLocal()
    try:
        # Verifica se já existe
        existing = db.query(User).filter(
            User.email == email,
            User.organization_id.is_(None),
            User.deleted_at.is_(None),
        ).first()

        if existing:
            print(f"❌ Superuser com email '{email}' já existe!")
            return False

        # Cria superuser
        user = User(
            organization_id=None,
            email=email,
            password_hash=get_password_hash(password),
            first_name=first_name,
            is_superuser=True,
            is_active=True,
        )
        db.add(user)
        db.commit()
        print(f"✅ Superuser '{email}' criado com sucesso!")
        return True
    except Exception as e:
        print(f"❌ Erro ao criar superuser: {e}")
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Uso: python -m app.cli <email> <password> [first_name]")
        print("Exemplo: python -m app.cli admin@example.com senha123 Admin")
        sys.exit(1)

    email = sys.argv[1]
    password = sys.argv[2]
    first_name = sys.argv[3] if len(sys.argv) > 3 else None

    success = create_superuser(email, password, first_name)
    sys.exit(0 if success else 1)
