"""
Configuración de conexión a la base de datos con SQLAlchemy 2.0 Async
"""
import ssl
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.engine.url import make_url

from ...core.config import settings


# Base para los modelos
Base = declarative_base()

# Preparar connect_args (SSL para PostgreSQL en producción)
connect_args = {}
url = make_url(settings.DATABASE_URL)
if url.drivername.startswith("postgresql+asyncpg"):
    if url.host and url.host not in {"localhost", "127.0.0.1"}:
        # Forzar SSL con certificados del sistema cuando es host remoto
        connect_args["ssl"] = ssl.create_default_context()

# Motor async de SQLAlchemy
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True if settings.ENVIRONMENT == "development" else False,
    future=True,
    pool_pre_ping=True,  # Verificar conexión antes de usar
    connect_args=connect_args,
)

# Factory para crear sesiones async
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # No expirar objetos después de commit
    autoflush=False,
    autocommit=False,
)


async def init_db():
    """
    Inicializar base de datos (crear todas las tablas)

    NOTA: En producción usar Alembic para migraciones
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Cerrar conexiones de la base de datos"""
    await engine.dispose()
