"""Serviço de tipos de sensor."""

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.sensor import SensorType
from app.schemas.sensor_type import SensorTypeCreate, SensorTypeUpdate


class SensorTypeService:
    """Serviço para gerenciamento de tipos de sensor."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, sensor_type_id: UUID) -> SensorType | None:
        """Busca tipo de sensor por ID."""
        return self.db.query(SensorType).filter(
            SensorType.id == sensor_type_id,
        ).first()

    def get_by_slug(self, slug: str, organization_id: UUID | None = None) -> SensorType | None:
        """Busca tipo de sensor por slug."""
        return self.db.query(SensorType).filter(
            SensorType.slug == slug,
            SensorType.organization_id == organization_id,
        ).first()

    def get_all_global(self) -> list[SensorType]:
        """Lista todos os tipos de sensor globais (sem organização)."""
        return self.db.query(SensorType).filter(
            SensorType.organization_id.is_(None),
            SensorType.is_active.is_(True),
        ).all()

    def get_all_for_organization(self, organization_id: UUID) -> list[SensorType]:
        """Lista tipos de sensor disponíveis para uma organização.

        Inclui tipos globais e específicos da organização.
        """
        return self.db.query(SensorType).filter(
            SensorType.is_active.is_(True),
            (SensorType.organization_id.is_(None)) | (SensorType.organization_id == organization_id),
        ).all()

    def create_global(self, sensor_type_data: SensorTypeCreate) -> SensorType:
        """Cria um tipo de sensor global (disponível para todas as organizações)."""
        sensor_type = SensorType(
            organization_id=None,
            name=sensor_type_data.name,
            slug=sensor_type_data.slug,
            category=sensor_type_data.category,
            description=sensor_type_data.description,
            manufacturer=sensor_type_data.manufacturer,
            model=sensor_type_data.model,
            specifications=sensor_type_data.specifications,
            supported_metrics=sensor_type_data.supported_metrics,
            payload_schema=sensor_type_data.payload_schema,
        )
        self.db.add(sensor_type)
        self.db.commit()
        self.db.refresh(sensor_type)
        return sensor_type

    def update(self, sensor_type: SensorType, sensor_type_data: SensorTypeUpdate) -> SensorType:
        """Atualiza tipo de sensor."""
        update_data = sensor_type_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(sensor_type, field, value)
        self.db.commit()
        self.db.refresh(sensor_type)
        return sensor_type

    def delete(self, sensor_type: SensorType) -> None:
        """Desativa um tipo de sensor (soft delete)."""
        sensor_type.is_active = False
        self.db.commit()
