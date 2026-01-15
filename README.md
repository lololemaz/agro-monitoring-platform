# 🌱 Agro Monitoring Platform

Plataforma de monitoramento agrícola com backend FastAPI e frontend React.

## 📋 Índice

- [Pré-requisitos](#-pré-requisitos)
- [Início Rápido](#-início-rápido)
- [Desenvolvimento](#-desenvolvimento)
- [Produção](#-produção)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Comandos Úteis](#-comandos-úteis)

---

## 🔧 Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)

---

## 🚀 Início Rápido

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd agro-monitoring-platform
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
# Edite o arquivo .env conforme necessário
```

### 3. Inicie os serviços

**Para desenvolvimento:**
```bash
docker compose -f docker-compose.dev.yml up --build
```

**Para produção:**
```bash
docker compose up --build
```

---

## 💻 Desenvolvimento

O ambiente de desenvolvimento inclui hot reload para frontend e backend.

```bash
docker compose -f docker-compose.dev.yml up --build
```

### URLs de Acesso

| Serviço | URL | Descrição |
|---------|-----|-----------|
| Frontend | http://localhost:5173 | Aplicação React (Vite) |
| Backend API | http://localhost:8000 | FastAPI |
| API Docs | http://localhost:8000/docs | Swagger UI |
| ReDoc | http://localhost:8000/redoc | Documentação alternativa |
| Database | localhost:5432 | TimescaleDB/PostgreSQL |

### Hot Reload

- **Backend**: Alterações em `backend/app/` são detectadas automaticamente
- **Frontend**: Alterações em `frontend/src/` são refletidas instantaneamente

### Executar em background

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

### Ver logs

```bash
# Todos os serviços
docker compose -f docker-compose.dev.yml logs -f

# Serviço específico
docker compose -f docker-compose.dev.yml logs -f api
docker compose -f docker-compose.dev.yml logs -f frontend
```

---

## 🏭 Produção

O ambiente de produção utiliza builds otimizados e nginx como reverse proxy.

```bash
docker compose up --build -d
```

### URLs de Acesso

| Serviço | URL | Descrição |
|---------|-----|-----------|
| Aplicação | http://localhost:8080 | Proxy unificado (API + Frontend) |
| Frontend | http://localhost:80 | Frontend direto (nginx) |

### Arquitetura de Produção

```
                    ┌─────────────┐
                    │   Cliente   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    Nginx    │ :8080
                    │   (Proxy)   │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │  Frontend   │ │   Backend   │ │  Database   │
    │   (nginx)   │ │  (FastAPI)  │ │(TimescaleDB)│
    └─────────────┘ └─────────────┘ └─────────────┘
```

---

## 📁 Estrutura do Projeto

```
agro-monitoring-platform/
├── backend/                    # Backend FastAPI
│   ├── app/
│   │   ├── core/              # Configurações core (auth, deps)
│   │   ├── models/            # Modelos SQLAlchemy
│   │   ├── routers/           # Endpoints da API
│   │   ├── schemas/           # Schemas Pydantic
│   │   └── services/          # Lógica de negócio
│   ├── alembic/               # Migrações do banco
│   ├── Dockerfile             # Build de produção
│   ├── Dockerfile.dev         # Build de desenvolvimento
│   └── pyproject.toml         # Dependências Python
│
├── frontend/                   # Frontend React
│   ├── src/
│   │   ├── components/        # Componentes React
│   │   ├── contexts/          # Contextos React
│   │   ├── hooks/             # Custom hooks
│   │   ├── pages/             # Páginas da aplicação
│   │   ├── services/          # Chamadas à API
│   │   └── types/             # Tipos TypeScript
│   ├── Dockerfile             # Build de produção
│   ├── Dockerfile.dev         # Build de desenvolvimento
│   └── package.json           # Dependências Node.js
│
├── docker-compose.yml          # Compose para produção
├── docker-compose.dev.yml      # Compose para desenvolvimento
├── nginx.conf                  # Config do reverse proxy
└── README.md                   # Este arquivo
```

---

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
# ===================================
# Database Configuration
# ===================================
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=mango_farm_monitor
POSTGRES_PORT=5432

# ===================================
# Backend API Configuration
# ===================================
SECRET_KEY=sua-chave-secreta-aqui
API_PORT=8000
DEBUG=false
ENVIRONMENT=production

# ===================================
# Frontend Configuration
# ===================================
VITE_API_URL=http://localhost:8000/api
FRONTEND_PORT=80

# ===================================
# Proxy Configuration
# ===================================
PROXY_PORT=8080

# ===================================
# CORS Origins
# ===================================
CORS_ORIGINS=http://localhost,http://localhost:80,http://localhost:8080,http://localhost:3000,http://localhost:5173
```

---

## 🛠 Comandos Úteis

### Docker Compose

```bash
# Iniciar serviços (desenvolvimento)
docker compose -f docker-compose.dev.yml up --build

# Iniciar serviços (produção)
docker compose up --build -d

# Parar serviços
docker compose down
docker compose -f docker-compose.dev.yml down

# Parar e remover volumes (limpar banco de dados)
docker compose down -v

# Rebuild de um serviço específico
docker compose -f docker-compose.dev.yml up --build api
docker compose -f docker-compose.dev.yml up --build frontend

# Ver status dos containers
docker compose ps
```

### Migrações do Banco de Dados

```bash
# Acessar container da API
docker compose -f docker-compose.dev.yml exec api bash

# Executar migrações (dentro do container)
alembic upgrade head

# Criar nova migração
alembic revision --autogenerate -m "descricao da migracao"
```

### Acessar o Banco de Dados

```bash
# Via psql (desenvolvimento)
docker compose -f docker-compose.dev.yml exec db psql -U postgres -d mango_farm_monitor

# Ou conecte com qualquer cliente PostgreSQL em localhost:5432
```

### Logs e Debug

```bash
# Ver logs em tempo real
docker compose -f docker-compose.dev.yml logs -f

# Ver logs de um serviço
docker compose -f docker-compose.dev.yml logs -f api
docker compose -f docker-compose.dev.yml logs -f frontend
docker compose -f docker-compose.dev.yml logs -f db

# Inspecionar container
docker inspect agro_api_dev
```

---

## 🐛 Troubleshooting

### Porta já está em uso

```bash
# Verificar processos usando a porta
sudo lsof -i :8000
sudo lsof -i :5173

# Matar processo
sudo kill -9 <PID>
```

### Erro de permissão no volume

```bash
# Ajustar permissões
sudo chown -R $USER:$USER ./backend ./frontend
```

### Limpar tudo e recomeçar

```bash
# Para todos os containers e remove volumes
docker compose -f docker-compose.dev.yml down -v

# Remove imagens órfãs
docker image prune -a

# Rebuild completo
docker compose -f docker-compose.dev.yml up --build --force-recreate
```

### Container não inicia

```bash
# Ver logs do container
docker compose -f docker-compose.dev.yml logs api

# Verificar status
docker compose -f docker-compose.dev.yml ps -a
```