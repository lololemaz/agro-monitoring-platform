"""Initial setup - extensions and tables.

Revision ID: 001_initial
Revises:
Create Date: 2026-01-14

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Criar extensões necessárias
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "pg_trgm"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "timescaledb"')

    # Organizations
    op.create_table(
        "organizations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("company_name", sa.String(255)),
        sa.Column("document", sa.String(50), unique=True),
        sa.Column("email", sa.String(255)),
        sa.Column("phone", sa.String(50)),
        sa.Column("address", sa.Text),
        sa.Column("logo_url", sa.Text),
        sa.Column("settings", postgresql.JSONB, server_default="{}"),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
    )

    # Users
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("first_name", sa.String(100)),
        sa.Column("last_name", sa.String(100)),
        sa.Column("phone", sa.String(50)),
        sa.Column("avatar_url", sa.Text),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("is_email_verified", sa.Boolean, server_default="false"),
        sa.Column("last_login_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
        sa.UniqueConstraint("organization_id", "email", name="unique_user_email_per_org"),
    )

    # Roles
    op.create_table(
        "roles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id", ondelete="CASCADE")),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("is_system_role", sa.Boolean, server_default="false"),
        sa.Column("permissions", postgresql.JSONB, server_default="[]"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.UniqueConstraint("organization_id", "slug", name="unique_role_slug_per_org"),
    )

    # User Roles
    op.create_table(
        "user_roles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("roles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("assigned_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("assigned_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.UniqueConstraint("user_id", "role_id", name="unique_user_role"),
    )

    # Farms
    op.create_table(
        "farms",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("code", sa.String(50)),
        sa.Column("total_area", sa.Numeric(10, 2)),
        sa.Column("address", sa.Text),
        sa.Column("coordinates", postgresql.JSONB),
        sa.Column("timezone", sa.String(50), server_default="'America/Recife'"),
        sa.Column("settings", postgresql.JSONB, server_default="{}"),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
    )

    # Plots
    op.create_table(
        "plots",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("farm_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("farms.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("code", sa.String(50)),
        sa.Column("area", sa.Numeric(10, 2), nullable=False),
        sa.Column("crop_type", sa.String(100), server_default="'Manga - Tommy Atkins'"),
        sa.Column("variety", sa.String(100)),
        sa.Column("planting_date", sa.Date),
        sa.Column("season", sa.String(50)),
        sa.Column("row_count", sa.Integer, server_default="0"),
        sa.Column("tree_count", sa.Integer, server_default="0"),
        sa.Column("coordinates", postgresql.JSONB),
        sa.Column("grid_position", postgresql.JSONB),
        sa.Column("extra_data", postgresql.JSONB, server_default="{}"),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.UniqueConstraint("farm_id", "code", name="unique_plot_code_per_farm"),
    )

    # Rows
    op.create_table(
        "rows",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("plot_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("plots.id", ondelete="CASCADE"), nullable=False),
        sa.Column("row_number", sa.Integer, nullable=False),
        sa.Column("tree_count", sa.Integer, server_default="0"),
        sa.Column("avg_health", sa.Numeric(5, 2)),
        sa.Column("irrigation_status", sa.String(20), server_default="'ok'"),
        sa.Column("extra_data", postgresql.JSONB, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.UniqueConstraint("plot_id", "row_number", name="unique_row_per_plot"),
    )

    # Trees
    op.create_table(
        "trees",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("row_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rows.id", ondelete="CASCADE"), nullable=False),
        sa.Column("plot_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("plots.id", ondelete="CASCADE"), nullable=False),
        sa.Column("tree_number", sa.Integer, nullable=False),
        sa.Column("variety", sa.String(100)),
        sa.Column("planting_date", sa.Date),
        sa.Column("health_score", sa.Numeric(5, 2)),
        sa.Column("fruit_count", sa.Integer, server_default="0"),
        sa.Column("last_inspection", sa.Date),
        sa.Column("coordinates", postgresql.JSONB),
        sa.Column("extra_data", postgresql.JSONB, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.UniqueConstraint("row_id", "tree_number", name="unique_tree_per_row"),
    )

    # Sensor Types
    op.create_table(
        "sensor_types",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id", ondelete="CASCADE")),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("manufacturer", sa.String(100)),
        sa.Column("model", sa.String(100)),
        sa.Column("specifications", postgresql.JSONB, server_default="{}"),
        sa.Column("supported_metrics", postgresql.JSONB, server_default="[]"),
        sa.Column("payload_schema", postgresql.JSONB),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.UniqueConstraint("organization_id", "slug", name="unique_sensor_type_slug_per_org"),
    )

    # Sensors
    op.create_table(
        "sensors",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("farm_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("farms.id", ondelete="SET NULL")),
        sa.Column("plot_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("plots.id", ondelete="SET NULL")),
        sa.Column("sensor_type_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("sensor_types.id"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("serial_number", sa.String(100), unique=True),
        sa.Column("mac_address", sa.String(50), unique=True),
        sa.Column("api_key", sa.String(255), unique=True),
        sa.Column("location", postgresql.JSONB),
        sa.Column("installation_date", sa.Date),
        sa.Column("last_signal_at", sa.DateTime(timezone=True)),
        sa.Column("battery_level", sa.Integer),
        sa.Column("signal_strength", sa.Integer),
        sa.Column("is_online", sa.Boolean, server_default="false"),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("firmware_version", sa.String(50)),
        sa.Column("configuration", postgresql.JSONB, server_default="{}"),
        sa.Column("extra_data", postgresql.JSONB, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
    )

    # Alerts
    op.create_table(
        "alerts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("farm_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("farms.id", ondelete="CASCADE")),
        sa.Column("plot_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("plots.id", ondelete="CASCADE")),
        sa.Column("row_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rows.id", ondelete="SET NULL")),
        sa.Column("tree_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("trees.id", ondelete="SET NULL")),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("severity", sa.String(20), nullable=False),
        sa.Column("type", sa.String(100), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("message", sa.Text, nullable=False),
        sa.Column("impact", sa.Text),
        sa.Column("suggested_action", sa.Text),
        sa.Column("source", sa.String(50)),
        sa.Column("source_id", postgresql.UUID(as_uuid=True)),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("acknowledged_at", sa.DateTime(timezone=True)),
        sa.Column("acknowledged_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("resolved_at", sa.DateTime(timezone=True)),
        sa.Column("resolved_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("resolution_notes", sa.Text),
        sa.Column("recurrence_count", sa.Integer, server_default="1"),
        sa.Column("extra_data", postgresql.JSONB, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    # Alert Rules
    op.create_table(
        "alert_rules",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("severity", sa.String(20), nullable=False),
        sa.Column("conditions", postgresql.JSONB, nullable=False),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
    )

    # Events
    op.create_table(
        "events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("farm_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("farms.id", ondelete="CASCADE")),
        sa.Column("plot_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("plots.id", ondelete="SET NULL")),
        sa.Column("row_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rows.id", ondelete="SET NULL")),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("scope", sa.String(20), nullable=False),
        sa.Column("scope_id", postgresql.UUID(as_uuid=True)),
        sa.Column("scope_name", sa.String(255)),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("irrigation_data", postgresql.JSONB),
        sa.Column("fertilization_data", postgresql.JSONB),
        sa.Column("product_data", postgresql.JSONB),
        sa.Column("notes", sa.Text),
        sa.Column("operator", sa.String(255)),
        sa.Column("team", sa.String(255)),
        sa.Column("tags", postgresql.JSONB, server_default="[]"),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("updated_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
    )

    # Event Attachments
    op.create_table(
        "event_attachments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("event_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("events.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("url", sa.Text, nullable=False),
        sa.Column("file_size", sa.Integer),
        sa.Column("mime_type", sa.String(100)),
        sa.Column("uploaded_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    # Notes
    op.create_table(
        "notes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("farm_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("farms.id", ondelete="CASCADE")),
        sa.Column("plot_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("plots.id", ondelete="CASCADE")),
        sa.Column("row_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rows.id", ondelete="SET NULL")),
        sa.Column("tree_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("trees.id", ondelete="SET NULL")),
        sa.Column("text", sa.Text, nullable=False),
        sa.Column("category", sa.String(50)),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True)),
    )

    # Plot Production Snapshots
    op.create_table(
        "plot_production_snapshots",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("plot_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("plots.id", ondelete="CASCADE"), nullable=False),
        sa.Column("snapshot_date", sa.Date, nullable=False),
        sa.Column("status", sa.String(20), server_default="'ok'"),
        sa.Column("health_score", sa.Numeric(5, 2)),
        sa.Column("production_stage", sa.String(50)),
        sa.Column("flowers_per_tree", sa.Numeric(8, 2)),
        sa.Column("total_flowers", sa.Integer),
        sa.Column("flowering_percentage", sa.Numeric(5, 2)),
        sa.Column("fruits_per_tree", sa.Numeric(8, 2)),
        sa.Column("total_fruits", sa.Integer),
        sa.Column("avg_fruit_size", sa.Numeric(6, 2)),
        sa.Column("fruit_caliber", sa.String(20)),
        sa.Column("estimated_yield_kg", sa.Numeric(10, 2)),
        sa.Column("estimated_yield_tons", sa.Numeric(10, 3)),
        sa.Column("harvest_start_date", sa.Date),
        sa.Column("harvest_end_date", sa.Date),
        sa.Column("days_to_harvest", sa.Integer),
        sa.Column("risk_level", sa.String(20)),
        sa.Column("risk_factors", postgresql.JSONB, server_default="[]"),
        sa.Column("last_soil_reading_id", postgresql.UUID(as_uuid=True)),
        sa.Column("last_vision_data_id", postgresql.UUID(as_uuid=True)),
        sa.Column("extra_data", postgresql.JSONB, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.UniqueConstraint("plot_id", "snapshot_date", name="unique_plot_snapshot_date"),
    )

    # ========== TIMESERIES TABLES ==========

    # Uplink Telemetry
    op.create_table(
        "uplink_telemetry",
        sa.Column("time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("sensor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("sensors.id", ondelete="CASCADE"), nullable=False),
        sa.Column("dev_eui", sa.CHAR(16)),
        sa.Column("f_port", sa.SmallInteger),
        sa.Column("rssi", sa.SmallInteger),
        sa.Column("snr", sa.Numeric),
        sa.Column("payload", postgresql.JSONB, nullable=False),
        sa.Column("extra_data", postgresql.JSONB, server_default="{}"),
        sa.PrimaryKeyConstraint("time", "sensor_id"),
    )

    # Soil Readings
    op.create_table(
        "soil_readings",
        sa.Column("time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("sensor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("sensors.id", ondelete="CASCADE"), nullable=False),
        sa.Column("plot_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("plots.id", ondelete="CASCADE"), nullable=False),
        sa.Column("moisture", sa.Numeric(5, 2)),
        sa.Column("temperature", sa.Numeric(5, 2)),
        sa.Column("ec", sa.Numeric(6, 3)),
        sa.Column("ph", sa.Numeric(4, 2)),
        sa.Column("nitrogen", sa.Numeric(6, 2)),
        sa.Column("phosphorus", sa.Numeric(6, 2)),
        sa.Column("potassium", sa.Numeric(6, 2)),
        sa.Column("extra_data", postgresql.JSONB, server_default="{}"),
        sa.PrimaryKeyConstraint("time", "sensor_id"),
    )

    # Vision Data
    op.create_table(
        "vision_data",
        sa.Column("time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("sensor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("sensors.id", ondelete="CASCADE"), nullable=False),
        sa.Column("plot_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("plots.id", ondelete="CASCADE"), nullable=False),
        sa.Column("irrigation_failures", sa.Integer, server_default="0"),
        sa.Column("water_stress_level", sa.Numeric(5, 2)),
        sa.Column("over_irrigation_detected", sa.Boolean, server_default="false"),
        sa.Column("blocked_lines", sa.Integer, server_default="0"),
        sa.Column("fruit_count", sa.Integer, server_default="0"),
        sa.Column("avg_fruit_size", sa.Numeric(6, 2)),
        sa.Column("flowering_percentage", sa.Numeric(5, 2)),
        sa.Column("pests_detected", sa.Boolean, server_default="false"),
        sa.Column("pest_type", sa.String(100)),
        sa.Column("fallen_fruits", sa.Integer, server_default="0"),
        sa.Column("chlorophyll_level", sa.Numeric(5, 2)),
        sa.Column("ndvi", sa.Numeric(4, 3)),
        sa.Column("vegetative_stress", sa.Numeric(5, 2)),
        sa.Column("maturity_index", sa.Numeric(5, 2)),
        sa.Column("image_urls", postgresql.JSONB, server_default="[]"),
        sa.Column("extra_data", postgresql.JSONB, server_default="{}"),
        sa.PrimaryKeyConstraint("time", "sensor_id"),
    )

    # Weather Data
    op.create_table(
        "weather_data",
        sa.Column("time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("sensor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("sensors.id", ondelete="CASCADE"), nullable=False),
        sa.Column("farm_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("farms.id", ondelete="SET NULL")),
        sa.Column("temperature", sa.Numeric(5, 2)),
        sa.Column("humidity", sa.Numeric(5, 2)),
        sa.Column("pressure", sa.Numeric(7, 2)),
        sa.Column("wind_speed", sa.Numeric(5, 2)),
        sa.Column("wind_direction", sa.Integer),
        sa.Column("rainfall", sa.Numeric(6, 2)),
        sa.Column("solar_radiation", sa.Numeric(7, 2)),
        sa.Column("extra_data", postgresql.JSONB, server_default="{}"),
        sa.PrimaryKeyConstraint("time", "sensor_id"),
    )

    # ========== HYPERTABLES ==========
    op.execute("SELECT create_hypertable('uplink_telemetry', 'time', chunk_time_interval => INTERVAL '1 day', if_not_exists => TRUE)")
    op.execute("SELECT create_hypertable('soil_readings', 'time', chunk_time_interval => INTERVAL '1 day', if_not_exists => TRUE)")
    op.execute("SELECT create_hypertable('vision_data', 'time', chunk_time_interval => INTERVAL '1 day', if_not_exists => TRUE)")
    op.execute("SELECT create_hypertable('weather_data', 'time', chunk_time_interval => INTERVAL '1 day', if_not_exists => TRUE)")

    # ========== INDEXES ==========
    op.create_index("idx_users_organization", "users", ["organization_id"])
    op.create_index("idx_users_email", "users", ["email"])
    op.create_index("idx_farms_organization", "farms", ["organization_id"])
    op.create_index("idx_plots_farm", "plots", ["farm_id"])
    op.create_index("idx_sensors_organization", "sensors", ["organization_id"])
    op.create_index("idx_sensors_farm", "sensors", ["farm_id"])
    op.create_index("idx_sensors_plot", "sensors", ["plot_id"])
    op.create_index("idx_alerts_organization", "alerts", ["organization_id"])
    op.create_index("idx_alerts_plot", "alerts", ["plot_id"])
    op.create_index("idx_alerts_severity", "alerts", ["severity"])
    op.create_index("idx_events_organization", "events", ["organization_id"])
    op.create_index("idx_events_plot", "events", ["plot_id"])
    op.create_index("idx_events_timestamp", "events", ["timestamp"])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table("weather_data")
    op.drop_table("vision_data")
    op.drop_table("soil_readings")
    op.drop_table("uplink_telemetry")
    op.drop_table("plot_production_snapshots")
    op.drop_table("notes")
    op.drop_table("event_attachments")
    op.drop_table("events")
    op.drop_table("alert_rules")
    op.drop_table("alerts")
    op.drop_table("sensors")
    op.drop_table("sensor_types")
    op.drop_table("trees")
    op.drop_table("rows")
    op.drop_table("plots")
    op.drop_table("farms")
    op.drop_table("user_roles")
    op.drop_table("roles")
    op.drop_table("users")
    op.drop_table("organizations")

    # Drop extensions
    op.execute('DROP EXTENSION IF EXISTS "timescaledb"')
    op.execute('DROP EXTENSION IF EXISTS "pg_trgm"')
    op.execute('DROP EXTENSION IF EXISTS "uuid-ossp"')
