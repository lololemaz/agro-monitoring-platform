"""Serviço de organizações."""

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.organization import Organization, User
from app.schemas.organization import OrganizationCreate, OrganizationUpdate


class OrganizationService:
    """Serviço para gerenciamento de organizações."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, org_id: UUID) -> Organization | None:
        """Busca organização por ID."""
        return self.db.query(Organization).filter(
            Organization.id == org_id,
            Organization.deleted_at.is_(None),
        ).first()

    def get_by_document(self, document: str) -> Organization | None:
        """Busca organização por documento (CNPJ/CPF)."""
        return self.db.query(Organization).filter(
            Organization.document == document,
            Organization.deleted_at.is_(None),
        ).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> list[Organization]:
        """Lista todas as organizações."""
        return self.db.query(Organization).filter(
            Organization.deleted_at.is_(None),
        ).offset(skip).limit(limit).all()

    def create(self, org_data: OrganizationCreate) -> tuple[Organization, User]:
        """Cria uma nova organização com seu owner."""
        # Criar organização
        organization = Organization(
            name=org_data.name,
            company_name=org_data.company_name,
            document=org_data.document,
            email=org_data.email,
            phone=org_data.phone,
            address=org_data.address,
        )
        self.db.add(organization)
        self.db.flush()  # Para obter o ID

        # Criar owner
        owner = User(
            organization_id=organization.id,
            email=org_data.owner_email,
            password_hash=get_password_hash(org_data.owner_password),
            first_name=org_data.owner_first_name,
            last_name=org_data.owner_last_name,
            is_org_owner=True,
        )
        self.db.add(owner)
        self.db.commit()
        self.db.refresh(organization)
        self.db.refresh(owner)

        return organization, owner

    def update(self, organization: Organization, org_data: OrganizationUpdate) -> Organization:
        """Atualiza dados da organização."""
        update_data = org_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(organization, field, value)
        self.db.commit()
        self.db.refresh(organization)
        return organization

    def delete(self, organization: Organization) -> None:
        """Soft delete de organização."""
        organization.deleted_at = datetime.now(timezone.utc)
        self.db.commit()

    def get_owner(self, organization: Organization) -> User | None:
        """Obtém o owner da organização."""
        return self.db.query(User).filter(
            User.organization_id == organization.id,
            User.is_org_owner.is_(True),
            User.deleted_at.is_(None),
        ).first()
