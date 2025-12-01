"""
Configuracion de conexion a la base de datos con SQLAlchemy 2.0 Async
"""
import ssl
import asyncio
import platform
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.engine.url import make_url

from ...core.config import settings


# Base para los modelos
Base = declarative_base()

# Preparar connect_args (SSL para PostgreSQL en produccion)
connect_args = {}
url = make_url(settings.DATABASE_URL)

# En Windows + psycopg se debe usar el event loop selector para conexiones async
if platform.system() == "Windows" and url.drivername.startswith("postgresql+psycopg"):
    try:
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    except Exception:
        # No interrumpir el arranque si ya existe una politica activa
        pass

if url.drivername.startswith("postgresql+psycopg"):
    if url.host and url.host not in {"localhost", "127.0.0.1"}:
        # psycopg usa sslmode para obligar TLS en conexiones remotas
        connect_args["sslmode"] = "require"
elif url.drivername.startswith("postgresql+asyncpg"):
    if url.host and url.host not in {"localhost", "127.0.0.1"}:
        # Forzar SSL con certificados del sistema cuando es host remoto
        connect_args["ssl"] = ssl.create_default_context()

# Motor async de SQLAlchemy
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True if settings.ENVIRONMENT == "development" else False,
    future=True,
    pool_pre_ping=True,  # Verificar conexion antes de usar
    connect_args=connect_args,
)

# Factory para crear sesiones async
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # No expirar objetos despues de commit
    autoflush=False,
    autocommit=False,
)


async def init_db():
    """Inicializar base de datos (crear todas las tablas)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Cerrar conexiones de la base de datos."""
    await engine.dispose()
