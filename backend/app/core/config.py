"""
Configuración de la aplicación usando Pydantic Settings
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Configuración general de la aplicación"""

    # Aplicación
    APP_NAME: str = "Embriones API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"

    # Base de datos
    DATABASE_URL: str = "sqlite+aiosqlite:///./embriones.db"

    # Seguridad
    SECRET_KEY: str = "tu-secret-key-super-segura-cambiar-en-produccion"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

    # UploadThing
    UPLOADTHING_TOKEN: str | None = None
    UPLOADTHING_API_URL: str = "https://api.uploadthing.com"

    @property
    def cors_origins(self) -> List[str]:
        """Orígenes permitidos para CORS"""
        return [
            self.FRONTEND_URL,
            "http://localhost:3000",
            "http://localhost:5173",
        ]

    # Uploads
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 5242880  # 5MB

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
