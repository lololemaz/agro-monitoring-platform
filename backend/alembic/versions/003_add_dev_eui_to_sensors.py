"""Add dev_eui to sensors table for ChirpStack integration.

Revision ID: 003
Revises: 002
Create Date: 2026-01-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "003_add_dev_eui"
down_revision: Union[str, None] = "002_user_flags"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add dev_eui column to sensors table."""
    op.add_column(
        "sensors",
        sa.Column("dev_eui", sa.String(16), unique=True, nullable=True),
    )
    
    # Criar índice para buscas rápidas por dev_eui
    op.create_index(
        "idx_sensors_dev_eui",
        "sensors",
        ["dev_eui"],
        unique=True,
        postgresql_where=sa.text("dev_eui IS NOT NULL"),
    )


def downgrade() -> None:
    """Remove dev_eui column from sensors table."""
    op.drop_index("idx_sensors_dev_eui", table_name="sensors")
    op.drop_column("sensors", "dev_eui")
