# Mango Farm Monitor API - Guia de Setup

Backend em Python usando FastAPI para o sistema de monitoramento de fazenda de mangas.

## 📋 Pré-requisitos

- Docker e Docker Compose
- (Opcional) Python 3.11+ e [uv](https://github.com/astral-sh/uv) para desenvolvimento local

## 🚀 Quick Start

```bash
# 1. Clone o repositório
cd farm_api

# 2. (Opcional) Crie o arquivo .env
cp .env.example .env

# 3. Inicie em modo desenvolvimento
make dev
```

A API estará disponível em: `http://localhost:8000`
- Documentação: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 🐳 Docker

### Modo Desenvolvimento

```bash
# Iniciar (com logs)
make dev

# Iniciar em background
make dev-d

# Ver logs
make logs

# Parar
make down
```

### Modo Produção

```bash
make up
```

### Comandos Úteis

```bash
make help          # Ver todos os comandos disponíveis
make logs          # Logs da API
make logs-db       # Logs do banco
make shell         # Shell no container
make clean         # Remove tudo (⚠️ apaga dados)
make superuser EMAIL=x PASS=y  # Cria superusuário
```

## 🗄️ Banco de Dados

### Migrações (Alembic)

```bash
# Executar migrações pendentes
make migrate

# Criar nova migração
make migrate-new MSG="descrição da migração"

# Reverter última migração
make migrate-down
```

### Estrutura

O banco usa PostgreSQL 14 com TimescaleDB. A migração inicial cria:
- Extensões: `uuid-ossp`, `pg_trgm`, `timescaledb`
- Todas as tabelas do schema
- Hypertables para séries temporais

## 🛠️ Desenvolvimento

### Linting

```bash
# Verificar
make lint

# Corrigir automaticamente
make lint-fix
```

### Testes

```bash
make test
```

### Estrutura do Projeto

```
farm_api/
├── alembic/              # Migrações do banco
│   └── versions/         # Arquivos de migração
├── app/
│   ├── models/           # Modelos SQLAlchemy
│   ├── routers/          # Rotas da API
│   ├── schemas/          # Schemas Pydantic
│   ├── config.py         # Configurações
│   ├── database.py       # Conexão com banco
│   └── main.py           # Aplicação FastAPI
├── docker-compose.yml    # Produção
├── docker-compose.dev.yml # Desenvolvimento
├── Dockerfile            # Imagem de produção
├── Dockerfile.dev        # Imagem de desenvolvimento
├── Makefile              # Comandos úteis
└── pyproject.toml        # Dependências
```

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` baseado em `.env.example`:

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `POSTGRES_USER` | Usuário do PostgreSQL | `postgres` |
| `POSTGRES_PASSWORD` | Senha do PostgreSQL | `postgres` |
| `POSTGRES_DB` | Nome do banco | `mango_farm_monitor` |
| `POSTGRES_PORT` | Porta do PostgreSQL | `5432` |
| `API_PORT` | Porta da API | `8000` |
| `SECRET_KEY` | Chave secreta JWT | - |
| `DEBUG` | Modo debug | `false` |
| `CORS_ORIGINS` | URLs permitidas | `localhost:3000,5173` |

## 🔐 Autenticação

### Primeiro Acesso

Após iniciar o sistema, crie um superusuário:

```bash
make superuser EMAIL=admin@example.com PASS=sua_senha_segura
```

### Hierarquia de Usuários

1. **Superuser**: Administrador do sistema
   - Cria organizações
   - Gerencia tipos de sensores globais
   - Acesso total ao sistema

2. **Organization Owner**: Proprietário da organização
   - Cria e gerencia usuários da organização
   - Acesso total aos dados da organização

3. **User**: Usuário comum
   - Acesso aos dados da organização
   - Permissões definidas pelo owner

### Endpoints de Autenticação

- `POST /api/auth/login` - Login (OAuth2 form)
- `POST /api/auth/login/json` - Login (JSON)
- `GET /api/auth/me` - Dados do usuário autenticado
- `POST /api/auth/change-password` - Alterar senha

### Endpoints de Admin (Superuser only)

- `GET/POST /api/admin/organizations` - Listar/criar organizações
- `GET/PATCH/DELETE /api/admin/organizations/{id}` - Gerenciar organização
- `GET/POST /api/admin/sensor-types` - Listar/criar tipos de sensor
- `GET/PATCH/DELETE /api/admin/sensor-types/{id}` - Gerenciar tipo de sensor
- `POST /api/admin/superusers` - Criar novo superuser

### Endpoints de Usuários (Organization Owner)

- `GET /api/users/` - Listar usuários da organização
- `POST /api/users/` - Criar usuário na organização
- `GET /api/users/{id}` - Obter usuário específico
- `PATCH /api/users/{id}` - Atualizar usuário
- `DELETE /api/users/{id}` - Remover usuário (soft delete)

### Endpoints de Recursos (Usuários autenticados)

**Fazendas (`/api/farms`)**
- `GET /api/farms/` - Listar fazendas
- `POST /api/farms/` - Criar fazenda
- `GET /api/farms/{id}` - Obter fazenda
- `PUT /api/farms/{id}` - Atualizar fazenda
- `DELETE /api/farms/{id}` - Remover fazenda (soft delete)

**Talhões (`/api/plots`)**
- `GET /api/plots/` - Listar talhões
- `POST /api/plots/` - Criar talhão
- `GET /api/plots/{id}` - Obter talhão
- `PUT /api/plots/{id}` - Atualizar talhão
- `DELETE /api/plots/{id}` - Remover talhão (soft delete)

**Sensores (`/api/sensors`)**
- `GET /api/sensors/` - Listar sensores
- `POST /api/sensors/` - Criar sensor
- `GET /api/sensors/{id}` - Obter sensor
- `PUT /api/sensors/{id}` - Atualizar sensor
- `DELETE /api/sensors/{id}` - Remover sensor (soft delete)

**Alertas (`/api/alerts`)**
- `GET /api/alerts/` - Listar alertas
- `POST /api/alerts/` - Criar alerta
- `GET /api/alerts/{id}` - Obter alerta
- `PATCH /api/alerts/{id}/acknowledge` - Reconhecer alerta
- `PATCH /api/alerts/{id}/resolve` - Resolver alerta

**Eventos (`/api/events`)**
- `GET /api/events/` - Listar eventos
- `POST /api/events/` - Criar evento
- `GET /api/events/{id}` - Obter evento
- `PUT /api/events/{id}` - Atualizar evento
- `DELETE /api/events/{id}` - Remover evento (soft delete)

**Analytics (`/api/analytics`)**
- `GET /api/analytics/` - Listar snapshots de produção
- `POST /api/analytics/` - Criar snapshot
- `GET /api/analytics/{id}` - Obter snapshot

> **Nota:** Todos os endpoints de recursos filtram automaticamente por `organization_id` do usuário autenticado. Superusers podem ver dados de todas as organizações.

## 📝 Notas

- **TimescaleDB** é usado para séries temporais (sensores, telemetria)
- **Multi-tenancy** via `organization_id` em todas as tabelas
- **Soft deletes** via campo `deleted_at`
- **UUIDs** para todos os IDs

## 📚 Makefile - Todos os Comandos

| Comando | Descrição |
|---------|-----------|
| `make help` | Mostra todos os comandos disponíveis |
| `make dev` | Inicia ambiente de desenvolvimento (com logs) |
| `make dev-d` | Inicia ambiente de desenvolvimento em background |
| `make up` | Inicia ambiente de produção |
| `make down` | Para os containers de desenvolvimento |
| `make down-prod` | Para os containers de produção |
| `make logs` | Mostra logs da API (dev) |
| `make logs-db` | Mostra logs do banco (dev) |
| `make shell` | Abre shell no container da API |
| `make clean` | Remove containers e volumes (⚠️ apaga dados) |
| `make migrate` | Executa migrações pendentes |
| `make migrate-new MSG="..."` | Cria nova migração |
| `make migrate-down` | Reverte última migração |
| `make lint` | Executa linters (ruff) |
| `make lint-fix` | Corrige problemas de lint automaticamente |
| `make test` | Executa testes |
| `make superuser EMAIL=x PASS=y` | Cria superusuário inicial |

## 🔗 Links

- [FastAPI](https://fastapi.tiangolo.com/)
- [Alembic](https://alembic.sqlalchemy.org/)
- [TimescaleDB](https://docs.timescale.com/)
- [uv](https://github.com/astral-sh/uv)
