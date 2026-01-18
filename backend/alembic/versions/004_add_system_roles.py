"""Add system roles.

Revision ID: 004_add_system_roles
Revises: 003_add_dev_eui_to_sensors
Create Date: 2026-01-17
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "004_add_system_roles"
down_revision = "003_add_dev_eui"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Adiciona roles de sistema padrao."""
    op.execute("""
        INSERT INTO roles (id, organization_id, name, slug, description, is_system_role, permissions)
        VALUES 
            (uuid_generate_v4(), NULL, 'Gerente', 'manager', 'Acesso total a organizacao, pode gerenciar usuarios e configuracoes', true, '["read", "write", "manage_users", "manage_settings"]'::jsonb),
            (uuid_generate_v4(), NULL, 'Agronomo', 'agronomist', 'Pode visualizar e editar dados de fazendas, talhoes e sensores', true, '["read", "write", "manage_farms"]'::jsonb),
            (uuid_generate_v4(), NULL, 'Operador', 'operator', 'Pode visualizar dados e registrar eventos', true, '["read", "create_events"]'::jsonb),
            (uuid_generate_v4(), NULL, 'Visualizador', 'viewer', 'Apenas visualizacao de dados', true, '["read"]'::jsonb)
        ON CONFLICT DO NOTHING;
    """)


def downgrade() -> None:
    """Remove roles de sistema."""
    op.execute("""
        DELETE FROM roles WHERE is_system_role = true AND organization_id IS NULL;
    """)
