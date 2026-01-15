# Database Schema - Mango Farm Monitor

## 🎯 Visão Geral

Sistema multi-tenant de monitoramento de fazendas de manga com TimescaleDB para time-series data. PostgreSQL 14+ com extensão TimescaleDB obrigatória.

## 📋 Estrutura Multi-Tenant

Todas as tabelas principais possuem `organization_id` para isolamento. Sempre filtrar por `organization_id` nas queries.

```
Organization → Farms → Plots → Sensors → Time-Series Data
```

---

## 🔐 Autenticação & Autorização

### Organizations
```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    document VARCHAR(50) UNIQUE, -- CNPJ/CPF
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
```

### Users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- bcrypt
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_email_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT unique_user_email_per_org UNIQUE (organization_id, email)
);
```

### Roles & Permissions
```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULL = sistema
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL, -- 'owner', 'executive', 'agronomist', 'operator', 'viewer'
    description TEXT,
    is_system_role BOOLEAN DEFAULT false,
    permissions JSONB DEFAULT '[]', -- ['farms:read', 'farms:write', '*']
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_role_slug_per_org UNIQUE (organization_id, slug)
);

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    CONSTRAINT unique_user_role UNIQUE (user_id, role_id)
);
```

**Roles Padrão:**
- `owner`: `["*"]` - Acesso total
- `executive`: `["farms:read", "farms:write", "analytics:read", "reports:read"]`
- `agronomist`: `["farms:read", "plots:read", "plots:write", "events:read", "events:write", "alerts:read", "alerts:write", "analytics:read"]`
- `operator`: `["plots:read", "events:write", "sensors:read"]`
- `viewer`: `["farms:read", "plots:read", "analytics:read"]`

---

## 🏗️ Estrutura Agrícola

### Farms
```sql
CREATE TABLE farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    total_area DECIMAL(10, 2), -- hectares
    address TEXT,
    coordinates JSONB, -- {lat, lng}
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id)
);
```

### Plots (Talhões)
```sql
CREATE TABLE plots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50), -- T01, T02
    area DECIMAL(10, 2) NOT NULL, -- hectares
    crop_type VARCHAR(100) DEFAULT 'Manga - Tommy Atkins',
    variety VARCHAR(100),
    planting_date DATE,
    season VARCHAR(50),
    row_count INTEGER DEFAULT 0,
    tree_count INTEGER DEFAULT 0,
    coordinates JSONB,
    grid_position JSONB, -- {row, col} para heatmap
    extra_data JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    CONSTRAINT unique_plot_code_per_farm UNIQUE (farm_id, code)
);
```

### Rows (Linhas)
```sql
CREATE TABLE rows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    row_number INTEGER NOT NULL,
    tree_count INTEGER DEFAULT 0,
    avg_health DECIMAL(5, 2), -- 0-100
    irrigation_status VARCHAR(20) DEFAULT 'ok',
    extra_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_row_per_plot UNIQUE (plot_id, row_number)
);
```

### Trees (Opcional)
```sql
CREATE TABLE trees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    row_id UUID NOT NULL REFERENCES rows(id) ON DELETE CASCADE,
    plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    tree_number INTEGER NOT NULL,
    variety VARCHAR(100),
    planting_date DATE,
    health_score DECIMAL(5, 2),
    fruit_count INTEGER DEFAULT 0,
    last_inspection DATE,
    coordinates JSONB,
    extra_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_tree_per_row UNIQUE (row_id, tree_number)
);
```

---

## 🔧 Sensores & Dispositivos

### Sensor Types (Catálogo)
```sql
CREATE TABLE sensor_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULL = global
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL, -- 'soil', 'weather', 'camera_rgb', 'camera_thermal', 'multispectral'
    category VARCHAR(50) NOT NULL, -- 'soil', 'weather', 'camera', 'irrigation'
    description TEXT,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    specifications JSONB DEFAULT '{}',
    supported_metrics JSONB DEFAULT '[]', -- ['moisture', 'temperature', 'ph', ...]
    payload_schema JSONB, -- JSON Schema para validação
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_sensor_type_slug_per_org UNIQUE (organization_id, slug)
);
```

**Tipos Padrão:**
- `soil`: Sensor de solo (moisture, temperature, ec, ph, nitrogen, phosphorus, potassium)
- `weather`: Estação meteorológica (temperature, humidity, pressure, wind_speed, rainfall, solar_radiation)
- `camera_rgb`: Câmera RGB (fruit_count, avg_fruit_size, flowering_percentage, pests_detected, fallen_fruits)
- `camera_thermal`: Câmera térmica (irrigation_failures, water_stress_level, over_irrigation_detected, blocked_lines)
- `multispectral`: Multiespectral (chlorophyll_level, ndvi, vegetative_stress, maturity_index)

### Sensors (Dispositivos Físicos)
```sql
CREATE TABLE sensors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES farms(id) ON DELETE SET NULL,
    plot_id UUID REFERENCES plots(id) ON DELETE SET NULL,
    sensor_type_id UUID NOT NULL REFERENCES sensor_types(id),
    name VARCHAR(255) NOT NULL,
    serial_number VARCHAR(100) UNIQUE,
    mac_address VARCHAR(50) UNIQUE,
    api_key VARCHAR(255) UNIQUE, -- Para autenticação IoT
    location JSONB, -- {lat, lng, description}
    installation_date DATE,
    last_signal_at TIMESTAMPTZ,
    battery_level INTEGER, -- 0-100
    signal_strength INTEGER, -- 0-100
    is_online BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    firmware_version VARCHAR(50),
    configuration JSONB DEFAULT '{}',
    extra_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id)
);
```

---

## ⏱️ Time-Series Data (TimescaleDB)

**⚠️ OBRIGATÓRIO:** Todas as tabelas de time-series devem usar TimescaleDB hypertables.

### Uplink Telemetry (Raw IoT Data)
```sql
CREATE TABLE uplink_telemetry (
    time TIMESTAMPTZ NOT NULL,
    sensor_id UUID NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
    dev_eui CHAR(16), -- Device EUI (LoRaWAN)
    f_port SMALLINT,
    rssi SMALLINT,
    snr FLOAT,
    payload JSONB NOT NULL, -- Raw payload do dispositivo
    extra_data JSONB DEFAULT '{}'
);

-- Criar hypertable
SELECT create_hypertable('uplink_telemetry', 'time',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Índices
CREATE INDEX idx_uplink_telemetry_sensor_time ON uplink_telemetry(sensor_id, time DESC);
CREATE INDEX idx_uplink_telemetry_dev_eui ON uplink_telemetry(dev_eui) WHERE dev_eui IS NOT NULL;
CREATE INDEX idx_uplink_telemetry_payload_gin ON uplink_telemetry USING GIN(payload);
```

### Soil Readings
```sql
CREATE TABLE soil_readings (
    time TIMESTAMPTZ NOT NULL,
    sensor_id UUID NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
    plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    moisture DECIMAL(5, 2), -- %
    temperature DECIMAL(5, 2), -- °C
    ec DECIMAL(6, 3), -- mS/cm
    ph DECIMAL(4, 2),
    nitrogen DECIMAL(6, 2), -- ppm
    phosphorus DECIMAL(6, 2), -- ppm
    potassium DECIMAL(6, 2), -- ppm
    extra_data JSONB DEFAULT '{}'
);

-- Criar hypertable
SELECT create_hypertable('soil_readings', 'time',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Índices
CREATE INDEX idx_soil_readings_sensor_time ON soil_readings(sensor_id, time DESC);
CREATE INDEX idx_soil_readings_plot_time ON soil_readings(plot_id, time DESC);
```

### Vision Data
```sql
CREATE TABLE vision_data (
    time TIMESTAMPTZ NOT NULL,
    sensor_id UUID NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
    plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    -- Thermal Camera
    irrigation_failures INTEGER DEFAULT 0,
    water_stress_level DECIMAL(5, 2), -- 0-100
    over_irrigation_detected BOOLEAN DEFAULT false,
    blocked_lines INTEGER DEFAULT 0,
    -- RGB Camera
    fruit_count INTEGER DEFAULT 0,
    avg_fruit_size DECIMAL(6, 2), -- mm ou grams
    flowering_percentage DECIMAL(5, 2), -- 0-100
    pests_detected BOOLEAN DEFAULT false,
    pest_type VARCHAR(100),
    fallen_fruits INTEGER DEFAULT 0,
    -- Multispectral
    chlorophyll_level DECIMAL(5, 2), -- 0-100
    ndvi DECIMAL(4, 3), -- -1 a 1
    vegetative_stress DECIMAL(5, 2), -- 0-100
    maturity_index DECIMAL(5, 2), -- 0-100
    image_urls JSONB DEFAULT '[]',
    extra_data JSONB DEFAULT '{}'
);

-- Criar hypertable
SELECT create_hypertable('vision_data', 'time',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Índices
CREATE INDEX idx_vision_data_sensor_time ON vision_data(sensor_id, time DESC);
CREATE INDEX idx_vision_data_plot_time ON vision_data(plot_id, time DESC);
```

### Weather Data
```sql
CREATE TABLE weather_data (
    time TIMESTAMPTZ NOT NULL,
    sensor_id UUID NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES farms(id) ON DELETE SET NULL,
    temperature DECIMAL(5, 2), -- °C
    humidity DECIMAL(5, 2), -- %
    pressure DECIMAL(7, 2), -- hPa
    wind_speed DECIMAL(5, 2), -- m/s
    wind_direction INTEGER, -- graus 0-360
    rainfall DECIMAL(6, 2), -- mm
    solar_radiation DECIMAL(7, 2), -- W/m²
    extra_data JSONB DEFAULT '{}'
);

-- Criar hypertable
SELECT create_hypertable('weather_data', 'time',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Índices
CREATE INDEX idx_weather_data_sensor_time ON weather_data(sensor_id, time DESC);
CREATE INDEX idx_weather_data_farm_time ON weather_data(farm_id, time DESC);
```

**Compressão TimescaleDB (Opcional):**
```sql
-- Habilitar compressão após 7 dias
ALTER TABLE soil_readings SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'sensor_id, plot_id',
    timescaledb.compress_orderby = 'time DESC'
);

SELECT add_compression_policy('soil_readings', INTERVAL '7 days');
```

---

## 🚨 Alertas

### Alerts
```sql
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
    plot_id UUID REFERENCES plots(id) ON DELETE CASCADE,
    row_id UUID REFERENCES rows(id) ON DELETE SET NULL,
    tree_id UUID REFERENCES trees(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL, -- 'irrigation', 'soil', 'pests', 'health', 'production', 'system'
    severity VARCHAR(20) NOT NULL, -- 'critical', 'warning', 'info'
    type VARCHAR(100) NOT NULL, -- 'irrigation_failure', 'water_stress', 'pest_detection', etc
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    impact TEXT,
    suggested_action TEXT,
    source VARCHAR(50), -- 'sensor', 'vision', 'manual', 'system'
    source_id UUID, -- ID do sensor/evento que gerou
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id),
    resolution_notes TEXT,
    recurrence_count INTEGER DEFAULT 1,
    extra_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Alert Rules
```sql
CREATE TABLE alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    conditions JSONB NOT NULL, -- Condições para disparar
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);
```

---

## 📅 Eventos

### Events
```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
    plot_id UUID REFERENCES plots(id) ON DELETE SET NULL,
    row_id UUID REFERENCES rows(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- 'irrigation', 'fertilization', 'nutrients', 'pesticide', 'pruning', 'soil_correction', 'maintenance', 'other'
    scope VARCHAR(20) NOT NULL, -- 'farm', 'plot', 'subarea', 'tree_group'
    scope_id UUID,
    scope_name VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    irrigation_data JSONB,
    fertilization_data JSONB,
    product_data JSONB,
    notes TEXT,
    operator VARCHAR(255),
    team VARCHAR(255),
    tags JSONB DEFAULT '[]', -- ['corrective', 'preventive', 'experiment', 'standard']
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
```

### Event Attachments
```sql
CREATE TABLE event_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'photo', 'document', 'invoice'
    url TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📝 Anotações

### Notes
```sql
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
    plot_id UUID REFERENCES plots(id) ON DELETE CASCADE,
    row_id UUID REFERENCES rows(id) ON DELETE SET NULL,
    tree_id UUID REFERENCES trees(id) ON DELETE SET NULL,
    text TEXT NOT NULL,
    category VARCHAR(50),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
```

---

## 📊 Analytics (Snapshots)

### Plot Production Snapshots
```sql
CREATE TABLE plot_production_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'ok', -- 'ok', 'warning', 'critical', 'offline'
    health_score DECIMAL(5, 2), -- 0-100
    production_stage VARCHAR(50), -- 'floração', 'frutificação', 'crescimento', 'maturação', 'pronto_colheita'
    flowers_per_tree DECIMAL(8, 2),
    total_flowers INTEGER,
    flowering_percentage DECIMAL(5, 2),
    fruits_per_tree DECIMAL(8, 2),
    total_fruits INTEGER,
    avg_fruit_size DECIMAL(6, 2), -- grams
    fruit_caliber VARCHAR(20), -- 'pequeno', 'médio', 'grande', 'extra_grande'
    estimated_yield_kg DECIMAL(10, 2),
    estimated_yield_tons DECIMAL(10, 3),
    harvest_start_date DATE,
    harvest_end_date DATE,
    days_to_harvest INTEGER,
    risk_level VARCHAR(20), -- 'baixo', 'médio', 'alto', 'crítico'
    risk_factors JSONB DEFAULT '[]',
    last_soil_reading_id UUID,
    last_vision_data_id UUID,
    extra_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_plot_snapshot_date UNIQUE (plot_id, snapshot_date)
);
```

---

## 🔄 Triggers & Functions

### Auto-update updated_at
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar em todas as tabelas com updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ... (aplicar em todas as tabelas)
```

### Update sensor last_signal
```sql
CREATE OR REPLACE FUNCTION update_sensor_last_signal()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE sensors 
    SET last_signal_at = NEW.time, 
        is_online = true,
        updated_at = NOW()
    WHERE id = NEW.sensor_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sensor_on_soil_reading AFTER INSERT ON soil_readings FOR EACH ROW EXECUTE FUNCTION update_sensor_last_signal();
CREATE TRIGGER update_sensor_on_vision_data AFTER INSERT ON vision_data FOR EACH ROW EXECUTE FUNCTION update_sensor_last_signal();
CREATE TRIGGER update_sensor_on_weather_data AFTER INSERT ON weather_data FOR EACH ROW EXECUTE FUNCTION update_sensor_last_signal();
CREATE TRIGGER update_sensor_on_uplink_telemetry AFTER INSERT ON uplink_telemetry FOR EACH ROW EXECUTE FUNCTION update_sensor_last_signal();
```

---

## 📌 Índices Principais

```sql
-- Organizations
CREATE INDEX idx_organizations_deleted_at ON organizations(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_active ON organizations(is_active) WHERE is_active = true;

-- Users
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

-- Farms
CREATE INDEX idx_farms_organization ON farms(organization_id);
CREATE INDEX idx_farms_deleted_at ON farms(deleted_at) WHERE deleted_at IS NULL;

-- Plots
CREATE INDEX idx_plots_farm ON plots(farm_id);
CREATE INDEX idx_plots_code ON plots(code);
CREATE INDEX idx_plots_deleted_at ON plots(deleted_at) WHERE deleted_at IS NULL;

-- Sensors
CREATE INDEX idx_sensors_organization ON sensors(organization_id);
CREATE INDEX idx_sensors_farm ON sensors(farm_id);
CREATE INDEX idx_sensors_plot ON sensors(plot_id);
CREATE INDEX idx_sensors_type ON sensors(sensor_type_id);
CREATE INDEX idx_sensors_api_key ON sensors(api_key) WHERE api_key IS NOT NULL;
CREATE INDEX idx_sensors_online ON sensors(is_online) WHERE is_online = true;
CREATE INDEX idx_sensors_deleted_at ON sensors(deleted_at) WHERE deleted_at IS NULL;

-- Alerts
CREATE INDEX idx_alerts_organization ON alerts(organization_id);
CREATE INDEX idx_alerts_plot ON alerts(plot_id);
CREATE INDEX idx_alerts_category ON alerts(category);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_timestamp ON alerts(timestamp DESC);
CREATE INDEX idx_alerts_unresolved ON alerts(resolved_at) WHERE resolved_at IS NULL;

-- Events
CREATE INDEX idx_events_organization ON events(organization_id);
CREATE INDEX idx_events_plot ON events(plot_id);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_timestamp ON events(timestamp DESC);
CREATE INDEX idx_events_deleted_at ON events(deleted_at) WHERE deleted_at IS NULL;
```

---

## 🔐 Segurança

### Row-Level Security (Recomendado)
```sql
-- Habilitar RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
-- ... (aplicar em todas as tabelas)

-- Política exemplo para users
CREATE POLICY users_organization_isolation ON users
    FOR ALL
    USING (organization_id = current_setting('app.current_organization_id')::UUID);
```

### Multi-Tenancy Filter
**SEMPRE** incluir `WHERE organization_id = ?` em todas as queries de dados da organização.

---

## 📊 Queries Úteis

### Última leitura de solo por talhão
```sql
SELECT DISTINCT ON (plot_id) *
FROM soil_readings
WHERE plot_id = ?
ORDER BY plot_id, time DESC;
```

### Alertas ativos por severidade
```sql
SELECT *
FROM alerts
WHERE organization_id = ? 
  AND resolved_at IS NULL
ORDER BY 
    CASE severity 
        WHEN 'critical' THEN 1 
        WHEN 'warning' THEN 2 
        ELSE 3 
    END,
    timestamp DESC;
```

### Time bucket (agregação por período)
```sql
SELECT 
    time_bucket('1 hour', time) AS bucket,
    AVG(moisture) AS avg_moisture,
    AVG(temperature) AS avg_temp
FROM soil_readings
WHERE plot_id = ? 
  AND time > NOW() - INTERVAL '24 hours'
GROUP BY bucket
ORDER BY bucket;
```

---

## 🚀 Setup Inicial

1. **Instalar TimescaleDB:**
```bash
# Ubuntu/Debian
sudo apt install timescaledb-2-postgresql-14

# macOS
brew install timescaledb

# Habilitar extensão
CREATE EXTENSION IF NOT EXISTS timescaledb;
```

2. **Criar banco:**
```sql
CREATE DATABASE mango_farm_monitor;
\c mango_farm_monitor
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "timescaledb";
```

3. **Executar schema:** Executar todas as CREATE TABLE acima, depois criar hypertables.

---

## 📝 Notas Importantes

- **TimescaleDB obrigatório** para `uplink_telemetry`, `soil_readings`, `vision_data`, `weather_data`
- **Sempre filtrar por `organization_id`** em queries de dados da organização
- **Soft deletes** via `deleted_at` (não usar DELETE físico)
- **UUIDs** para todos os IDs
- **JSONB** para dados flexíveis (extra_data, settings, etc)
- **Timestamps** em TIMESTAMPTZ (timezone-aware)
- **Índices parciais** para performance (WHERE deleted_at IS NULL)

---

## 🔗 Referências

- [TimescaleDB Documentation](https://docs.timescale.com/)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
- [Row-Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)