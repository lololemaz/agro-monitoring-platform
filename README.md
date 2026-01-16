# 🌱 Agro Monitoring Platform

Plataforma de monitoramento agrícola com backend FastAPI e frontend React.

## 📋 Índice

- [Pré-requisitos](#-pré-requisitos)
- [Mapeamento de Portas](#-mapeamento-de-portas)
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

## 🌐 Mapeamento de Portas

### Modo Desenvolvimento (`docker-compose.dev.yml`)

| Serviço | Porta | URL | Credenciais |
|---------|-------|-----|-------------|
| Frontend (Vite) | 5173 | http://localhost:5173 | - |
| Backend API | 8000 | http://localhost:8000 | - |
| Swagger Docs | 8000 | http://localhost:8000/docs | - |
| ReDoc | 8000 | http://localhost:8000/redoc | - |
| PostgreSQL | 5432 | localhost:5432 | `postgres` / `postgres` |
| pgAdmin | 5050 | http://localhost:5050 | `admin@admin.com` / `admin` |

### Modo Produção (`docker-compose.yml`)

| Serviço | Porta | URL | Descrição |
|---------|-------|-----|-----------|
| Frontend (nginx) | 80 | http://localhost | App React buildado |
| Reverse Proxy | 8080 | http://localhost:8080 | API + Frontend unificados |
| Backend API | 8000 | http://localhost:8000 | FastAPI (interno) |
| PostgreSQL | - | interno | Não exposto externamente |

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

O ambiente de desenvolvimento inclui hot reload para frontend e backend, além do pgAdmin para gerenciamento do banco de dados.

```bash
docker compose -f docker-compose.dev.yml up --build
```

### Hot Reload

- **Backend**: Alterações em `backend/app/` são detectadas automaticamente
- **Frontend**: Alterações em `frontend/src/` são refletidas instantaneamente

### 🗄️ pgAdmin (Gerenciador de Banco de Dados)

**Acesso:** http://localhost:5050

**Login:**
- Email: `admin@admin.com`
- Senha: `admin`

#### Configurar conexão com o banco:

1. Clique em **Add New Server**
2. Aba **General** → Name: `Agro Dev`
3. Aba **Connection** → Preencha conforme abaixo:

| Campo | Valor |
|-------|-------|
| **Host name/address** | `db` |
| **Port** | `5432` |
| **Maintenance database** | `mango_farm_monitor` |
| **Username** | `postgres` |
| **Password** | `postgres` |

4. Marque ✅ **Save password**
5. Clique em **Save**

> ⚠️ **IMPORTANTE:** Use `db` como host, **NÃO use** `localhost`!  
> O pgAdmin roda dentro de um container Docker e `db` é o nome do serviço do banco na rede interna.

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

> 📌 Veja o [Mapeamento de Portas](#-mapeamento-de-portas) para URLs de acesso.

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

# Cria a conta do usuario superadmin
docker compose exec api python -m app.cli "admin@example.com" "senha123" "Admin"

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