FROM python:3.11-slim

# Installation des dépendances système pour psycopg2 (Postgres)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Installation des dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copie du code
COPY main.py .

# Créer le répertoire certs (les certificats seront montés via volume dans docker-compose)
RUN mkdir -p ./certs

# Lancement du script
CMD ["python", "-u", "main.py"]
