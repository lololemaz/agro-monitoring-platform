"""Add user flags (is_superuser, is_org_owner).

Revision ID: 002_user_flags
Revises: 001_initial
Create Date: 2026-01-14

"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "002_user_flags"
down_revision = "001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Adicionar novas colunas
    op.add_column(
        "users",
        sa.Column("is_superuser", sa.Boolean, server_default="false", nullable=False),
    )
    op.add_column(
        "users",
        sa.Column("is_org_owner", sa.Boolean, server_default="false", nullable=False),
    )

    # Tornar organization_id nullable (para superusers)
    op.alter_column(
        "users",
        "organization_id",
        existing_type=sa.UUID(),
        nullable=True,
    )

    # Criar índice único para email de superusers
    op.execute("""
        CREATE UNIQUE INDEX idx_superuser_email
        ON users (email)
        WHERE organization_id IS NULL
    """)


def downgrade() -> None:
    # Remover índice
    op.drop_index("idx_superuser_email", table_name="users")

    # Tornar organization_id NOT NULL novamente
    op.alter_column(
        "users",
        "organization_id",
        existing_type=sa.UUID(),
        nullable=False,
    )

    # Remover colunas
    op.drop_column("users", "is_org_owner")
    op.drop_column("users", "is_superuser")
