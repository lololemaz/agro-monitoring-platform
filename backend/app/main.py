"""Aplicação principal FastAPI."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import admin, alerts, analytics, auth, events, farms, plots, sensors, users

app = FastAPI(
    title="Mango Farm Monitor API",
    description="Sistema de monitoramento de fazenda de mangas",
    version="0.1.0",
    debug=settings.debug,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas públicas
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

# Rotas de administração (superuser only)
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

# Rotas de gestão de usuários
app.include_router(users.router, prefix="/api/users", tags=["users"])

# Rotas protegidas (requerem autenticação)
app.include_router(farms.router, prefix="/api/farms", tags=["farms"])
app.include_router(plots.router, prefix="/api/plots", tags=["plots"])
app.include_router(sensors.router, prefix="/api/sensors", tags=["sensors"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["alerts"])
app.include_router(events.router, prefix="/api/events", tags=["events"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])


@app.get("/")
async def root():
    """Endpoint raiz."""
    return {"message": "Mango Farm Monitor API", "version": "0.1.0"}


@app.get("/health")
async def health():
    """Health check."""
    return {"status": "ok"}
