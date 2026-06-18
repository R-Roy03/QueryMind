from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """App-wide settings loaded from .env file."""
    mistral_api_key: str
    mistral_model: str = "mistral-large-latest"
    target_db_url: str
    app_db_url: str = "sqlite+aiosqlite:///./querymind_cache.db"
    cors_origins: str = "http://localhost:5173"
    max_rows: int = 500
    query_timeout: int = 30

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse comma-separated CORS origins into a list."""
        return [o.strip() for o in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"


settings = Settings()
