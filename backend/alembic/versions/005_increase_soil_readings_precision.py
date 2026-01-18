"""Aumenta precisao dos campos numericos em soil_readings

Revision ID: 005_soil_precision
Revises: 004_add_system_roles
Create Date: 2026-01-17

"""

from alembic import op
import sqlalchemy as sa

revision = "005_soil_precision"
down_revision = "004_add_system_roles"
branch_labels = None
depends_on = None


def upgrade():
    # Aumentar precisao para suportar valores maiores dos sensores
    # nitrogen: 36902.0 precisa de NUMERIC(10,2)
    # ec: 3755.0 precisa de NUMERIC(10,3)
    # phosphorus e potassium: aumentar para consistencia
    
    op.alter_column(
        "soil_readings",
        "nitrogen",
        type_=sa.Numeric(10, 2),
        existing_type=sa.Numeric(6, 2),
    )
    
    op.alter_column(
        "soil_readings",
        "phosphorus",
        type_=sa.Numeric(10, 2),
        existing_type=sa.Numeric(6, 2),
    )
    
    op.alter_column(
        "soil_readings",
        "potassium",
        type_=sa.Numeric(10, 2),
        existing_type=sa.Numeric(6, 2),
    )
    
    op.alter_column(
        "soil_readings",
        "ec",
        type_=sa.Numeric(10, 3),
        existing_type=sa.Numeric(6, 3),
    )


def downgrade():
    op.alter_column(
        "soil_readings",
        "nitrogen",
        type_=sa.Numeric(6, 2),
        existing_type=sa.Numeric(10, 2),
    )
    
    op.alter_column(
        "soil_readings",
        "phosphorus",
        type_=sa.Numeric(6, 2),
        existing_type=sa.Numeric(10, 2),
    )
    
    op.alter_column(
        "soil_readings",
        "potassium",
        type_=sa.Numeric(6, 2),
        existing_type=sa.Numeric(10, 2),
    )
    
    op.alter_column(
        "soil_readings",
        "ec",
        type_=sa.Numeric(6, 3),
        existing_type=sa.Numeric(10, 3),
    )
