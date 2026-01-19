"""Serviço de usuários."""

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.core.security import get_password_hash, verify_password
from app.models.organization import User, UserRole, Role
from app.schemas.user import UserCreate, UserUpdate, SuperUserCreate


class UserService:
    """Serviço para gerenciamento de usuários."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: UUID) -> User | None:
        """Busca usuário por ID."""
        return self.db.query(User).filter(
            User.id == user_id,
            User.deleted_at.is_(None),
        ).first()

    def get_by_id_with_roles(self, user_id: UUID) -> User | None:
        """Busca usuário por ID com roles carregados."""
        return self.db.query(User).options(
            joinedload(User.roles).joinedload(UserRole.role)
        ).filter(
            User.id == user_id,
            User.deleted_at.is_(None),
        ).first()

    def get_by_email(self, email: str, organization_id: UUID | None = None) -> User | None:
        """Busca usuário por email."""
        query = self.db.query(User).filter(
            User.email == email,
            User.deleted_at.is_(None),
        )
        if organization_id:
            query = query.filter(User.organization_id == organization_id)
        else:
            # Busca superuser (sem organização)
            query = query.filter(User.organization_id.is_(None))
        return query.first()

    def get_by_email_any_org(self, email: str) -> User | None:
        """Busca usuário por email em qualquer organização."""
        return self.db.query(User).filter(
            User.email == email,
            User.deleted_at.is_(None),
        ).first()

    def get_users_by_organization(self, organization_id: UUID) -> list[User]:
        """Lista usuários de uma organização com seus roles."""
        return self.db.query(User).options(
            joinedload(User.roles).joinedload(UserRole.role)
        ).filter(
            User.organization_id == organization_id,
            User.deleted_at.is_(None),
        ).all()

    def authenticate(self, email: str, password: str) -> User | None:
        """Autentica usuário por email e senha."""
        # Primeiro tenta como superuser
        user = self.get_by_email(email, organization_id=None)
        if user and verify_password(password, user.password_hash):
            return user

        # Depois busca em qualquer organização
        user = self.get_by_email_any_org(email)
        if user and verify_password(password, user.password_hash):
            return user

        return None

    def create_user(
        self,
        user_data: UserCreate,
        organization_id: UUID,
        created_by: UUID | None = None,
    ) -> User:
        """Cria um novo usuário em uma organização."""
        user = User(
            organization_id=organization_id,
            email=user_data.email,
            password_hash=get_password_hash(user_data.password),
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            phone=user_data.phone,
            is_org_owner=user_data.is_org_owner,
        )
        self.db.add(user)
        self.db.flush()  # Para obter o ID do usuário
        
        # Atribui role se informado
        if user_data.role_id:
            user_role = UserRole(
                user_id=user.id,
                role_id=user_data.role_id,
                assigned_by=created_by,
            )
            self.db.add(user_role)
        
        self.db.commit()
        self.db.refresh(user)
        return user

    def create_superuser(self, user_data: SuperUserCreate) -> User:
        """Cria um superusuário (admin do sistema)."""
        user = User(
            organization_id=None,
            email=user_data.email,
            password_hash=get_password_hash(user_data.password),
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            phone=user_data.phone,
            is_superuser=True,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_user(self, user: User, user_data: UserUpdate, role_id: UUID | None = None, assigned_by: UUID | None = None) -> User:
        """Atualiza dados do usuário."""
        update_data = user_data.model_dump(exclude_unset=True)
        
        # Remove role_id do update_data se existir (tratamos separadamente)
        update_data.pop('role_id', None)
        
        for field, value in update_data.items():
            setattr(user, field, value)
        
        # Atualiza role se informado
        if role_id is not None:
            # Remove roles existentes
            self.db.query(UserRole).filter(UserRole.user_id == user.id).delete()
            
            # Adiciona novo role
            if role_id:  # Se role_id não for vazio/None
                user_role = UserRole(
                    user_id=user.id,
                    role_id=role_id,
                    assigned_by=assigned_by,
                )
                self.db.add(user_role)
        
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_last_login(self, user: User) -> None:
        """Atualiza timestamp do último login."""
        user.last_login_at = datetime.now(timezone.utc)
        self.db.commit()

    def change_password(self, user: User, new_password: str) -> User:
        """Altera a senha do usuário."""
        user.password_hash = get_password_hash(new_password)
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete_user(self, user: User) -> None:
        """Soft delete de usuário."""
        user.deleted_at = datetime.now(timezone.utc)
        self.db.commit()

    def count_superusers(self) -> int:
        """Conta o número de superusuários."""
        return self.db.query(User).filter(
            User.is_superuser.is_(True),
            User.deleted_at.is_(None),
        ).count()
