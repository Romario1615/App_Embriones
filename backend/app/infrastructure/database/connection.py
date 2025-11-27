"""
Configuración de conexión a la base de datos con SQLAlchemy 2.0 Async
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

from ...core.config import settings


# Base para los modelos
Base = declarative_base()

# Motor async de SQLAlchemy
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True if settings.ENVIRONMENT == "development" else False,
    future=True,
    pool_pre_ping=True,  # Verificar conexión antes de usar
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
