"""Configurações da aplicação."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configurações da aplicação."""

    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/mango_farm_monitor"

    # Security
    secret_key: str = "dev-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Application
    debug: bool = False
    environment: str = "development"

    # CORS
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        """Retorna lista de origens CORS."""
        return [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()
