# Dockerfile para produção
FROM python:3.11-slim AS builder

WORKDIR /app

# Instalar uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copiar arquivos de dependências
COPY pyproject.toml uv.lock* ./

# Criar ambiente virtual e instalar dependências
RUN uv venv /opt/venv
ENV VIRTUAL_ENV=/opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN uv pip install --no-cache -r pyproject.toml

# Imagem final
FROM python:3.11-slim

WORKDIR /app

# Copiar ambiente virtual do builder
COPY --from=builder /opt/venv /opt/venv
ENV VIRTUAL_ENV=/opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copiar código da aplicação
COPY . .

# Criar usuário não-root
RUN useradd --create-home appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
