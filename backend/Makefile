.PHONY: help dev up down logs shell migrate migrate-new clean lint test

help: ## Mostra esta mensagem de ajuda
	@echo "Comandos disponíveis:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ========== Docker ==========

dev: ## Inicia ambiente de desenvolvimento
	docker compose -f docker-compose.dev.yml up --build

dev-d: ## Inicia ambiente de desenvolvimento em background
	docker compose -f docker-compose.dev.yml up --build -d

up: ## Inicia ambiente de produção
	docker compose up --build -d

down: ## Para os containers de desenvolvimento
	docker compose -f docker-compose.dev.yml down

down-prod: ## Para os containers de produção
	docker compose down

logs: ## Mostra logs da API (dev)
	docker compose -f docker-compose.dev.yml logs -f api

logs-db: ## Mostra logs do banco (dev)
	docker compose -f docker-compose.dev.yml logs -f db

shell: ## Abre shell no container da API
	docker compose -f docker-compose.dev.yml exec api bash

clean: ## Remove containers e volumes (⚠️ apaga dados)
	docker compose -f docker-compose.dev.yml down -v
	docker compose down -v

# ========== Database ==========

migrate: ## Executa migrações pendentes
	docker compose -f docker-compose.dev.yml exec api alembic upgrade head

migrate-new: ## Cria nova migração (use: make migrate-new MSG="descrição")
	docker compose -f docker-compose.dev.yml exec api alembic revision --autogenerate -m "$(MSG)"

migrate-down: ## Reverte última migração
	docker compose -f docker-compose.dev.yml exec api alembic downgrade -1

# ========== Development ==========

lint: ## Executa linters (ruff + pylint)
	docker compose -f docker-compose.dev.yml exec api ruff check app/
	docker compose -f docker-compose.dev.yml exec api ruff format --check app/

lint-fix: ## Corrige problemas de lint automaticamente
	docker compose -f docker-compose.dev.yml exec api ruff check --fix app/
	docker compose -f docker-compose.dev.yml exec api ruff format app/

test: ## Executa testes
	docker compose -f docker-compose.dev.yml exec api pytest

# ========== Admin ==========

superuser: ## Cria superuser inicial (use: make superuser EMAIL=admin@example.com PASS=senha123)
	docker compose -f docker-compose.dev.yml exec api python -m app.cli "$(EMAIL)" "$(PASS)" "Admin"
