# 🌱 Agro Monitoring Platform

Plataforma de monitoramento agrícola com backend FastAPI e frontend React.

## 📋 Índice

- [Pré-requisitos](#-pré-requisitos)
- [Mapeamento de Portas](#-mapeamento-de-portas)
- [Início Rápido](#-início-rápido)
- [Desenvolvimento](#-desenvolvimento)
- [Produção](#-produção)
- [Deploy em VM (Azure/AWS/GCP)](#-deploy-em-vm)
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
| Nginx (Proxy) | 80 | http://localhost | - |
| PostgreSQL | 5435 | localhost:5435 | `postgres` / `postgres` |
| pgAdmin | 5050 | http://localhost:5050 | `admin@admin.com` / `admin` |

> **Nota:** Em desenvolvimento, acesse tudo via porta 80 (nginx). API e Frontend não expõem portas diretamente.

### Modo Produção (`docker-compose.yml`)

| Serviço | Porta | URL | Descrição |
|---------|-------|-----|-----------|
| Nginx (Proxy) | 80 | http://seu-ip | Único ponto de entrada |

**URLs disponíveis via Nginx:**
- `http://seu-ip/` → Frontend React
- `http://seu-ip/api` → Backend API
- `http://seu-ip/docs` → Swagger Docs
- `http://seu-ip/redoc` → ReDoc

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
docker compose -f docker-compose.dev.yml up --build -d
```

**Para produção:**
```bash
docker compose up --build -d
```

### 4. Criar usuário administrador

```bash
# Desenvolvimento
docker compose -f docker-compose.dev.yml exec api python -m app.cli "admin@example.com" "senha123" "Admin"

# Produção
docker compose exec api python -m app.cli "admin@example.com" "senha123" "Admin"
```

---

## 💻 Desenvolvimento

O ambiente de desenvolvimento inclui hot reload para frontend e backend, além do pgAdmin para gerenciamento do banco de dados.

```bash
docker compose -f docker-compose.dev.yml up --build -d
```

**Acesse:** http://localhost

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

---

## 🏭 Produção

O ambiente de produção utiliza builds otimizados e nginx como proxy reverso.

```bash
docker compose up --build -d
```

### Arquitetura de Produção

```
                    ┌─────────────┐
                    │   Cliente   │
                    │  (Browser)  │
                    └──────┬──────┘
                           │
                           │ :80
                    ┌──────▼──────┐
                    │    Nginx    │
                    │   (Proxy)   │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           │ /             │ /api          │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │  Frontend   │ │   Backend   │ │  Database   │
    │   (React)   │ │  (FastAPI)  │ │(TimescaleDB)│
    │    :80      │ │    :8000    │ │    :5432    │
    └─────────────┘ └─────────────┘ └─────────────┘
           │               │               │
           └───────────────┴───────────────┘
                    (rede interna)
```

**Vantagens:**
- ✅ Apenas porta 80 exposta
- ✅ Sem problemas de CORS
- ✅ Mais seguro
- ✅ Fácil de adicionar HTTPS

---

## ☁️ Deploy em VM

### Azure / AWS / GCP

1. **Provisione uma VM** com Ubuntu 22.04+ e Docker instalado

2. **Clone o repositório na VM:**
```bash
git clone <url-do-repositorio>
cd agro-monitoring-platform
```

3. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
nano .env
```

Ajuste o `.env`:
```bash
# IMPORTANTE: Use uma chave segura em produção!
SECRET_KEY=sua-chave-segura-aqui-minimo-32-caracteres

# Credenciais do banco (altere em produção!)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=senha-forte-aqui
```

4. **Inicie os serviços:**
```bash
docker compose up --build -d
```

5. **Crie o usuário admin:**
```bash
docker compose exec api python -m app.cli "admin@empresa.com" "senha-forte" "Admin"
```

6. **Configure o Firewall (NSG/Security Group):**
   - ✅ Libere a porta **80** (HTTP)
   - ✅ Libere a porta **443** (HTTPS, se usar)
   - ❌ **NÃO** libere 8000, 5432, etc.

7. **Acesse:**
   - Frontend: `http://IP-DA-VM/`
   - API Docs: `http://IP-DA-VM/docs`

### Adicionar HTTPS (Recomendado)

Para HTTPS com Let's Encrypt, use um proxy como Traefik ou Caddy, ou configure o Nginx com certbot.

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
├── mqtt-bridge/                # Bridge MQTT → Database
│   ├── main.py                # Script principal
│   ├── certs/                 # Certificados TLS
│   └── Dockerfile
│
├── docker-compose.yml          # Compose para produção
├── docker-compose.dev.yml      # Compose para desenvolvimento
├── nginx.conf                  # Config nginx (desenvolvimento)
├── nginx.prod.conf             # Config nginx (produção)
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

# ===================================
# Backend API Configuration
# ===================================
SECRET_KEY=sua-chave-secreta-aqui-minimo-32-caracteres

# ===================================
# MQTT Bridge Configuration
# ===================================
MQTT_BROKER=seu-broker-mqtt.com
MQTT_PORT=8883
MQTT_TOPIC=application/+/device/+/event/up
```

---

## 🛠 Comandos Úteis

### Docker Compose

```bash
# Iniciar serviços (desenvolvimento)
docker compose -f docker-compose.dev.yml up --build -d

# Iniciar serviços (produção)
docker compose up --build -d

# Criar usuário superadmin
docker compose exec api python -m app.cli "admin@example.com" "senha123" "Admin"

# Parar serviços
docker compose down
docker compose -f docker-compose.dev.yml down

# Parar e remover volumes (limpar banco de dados)
docker compose down -v

# Ver status dos containers
docker compose ps

# Ver logs
docker compose logs -f
docker compose logs -f api
docker compose logs -f nginx
```

### Migrações do Banco de Dados

```bash
# Acessar container da API
docker compose exec api bash

# Executar migrações (dentro do container)
alembic upgrade head

# Criar nova migração
alembic revision --autogenerate -m "descricao da migracao"
```

### Acessar o Banco de Dados

```bash
# Via psql (produção)
docker compose exec db psql -U postgres -d mango_farm_monitor

# Via psql (desenvolvimento)
docker compose -f docker-compose.dev.yml exec db psql -U postgres -d mango_farm_monitor
```

---

## 🐛 Troubleshooting

### Porta já está em uso

```bash
# Verificar processos usando a porta
sudo lsof -i :80
sudo lsof -i :8000

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
docker compose down -v

# Remove imagens órfãs
docker image prune -a

# Rebuild completo
docker compose up --build --force-recreate -d
```

### Container não inicia

```bash
# Ver logs do container
docker compose logs api
docker compose logs nginx

# Verificar status
docker compose ps -a
```

### Nginx retorna 502 Bad Gateway

```bash
# Verificar se API está rodando
docker compose ps

# Ver logs da API
docker compose logs api

# Verificar se API responde internamente
docker compose exec nginx wget -qO- http://api:8000/api/health || echo "API não responde"
```
