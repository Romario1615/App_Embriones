"""
Aplicacion principal FastAPI
Sistema de Gestion de Embriones Bovinos
"""
from contextlib import asynccontextmanager
import time

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from .core.config import settings
from .core.dependencies import get_db
from .infrastructure.database.connection import close_db, init_db
from .presentation.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Eventos de ciclo de vida de la aplicacion.

    Se ejecuta al iniciar y cerrar la aplicacion.
    """
    # Startup
    print("[*] Iniciando aplicacion...")
    await init_db()
    print("[OK] Base de datos inicializada")

    yield

    # Shutdown
    print("[*] Cerrando aplicacion...")
    await close_db()
    print("[OK] Conexiones cerradas")


# Crear aplicacion FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API REST para gestion de transferencia de embriones bovinos",
    lifespan=lifespan,
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montar archivos estaticos (uploads)
try:
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
except RuntimeError:
    # Si el directorio no existe, crear
    import os

    os.makedirs("uploads/donadoras", exist_ok=True)
    os.makedirs("uploads/microscopicas", exist_ok=True)
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Incluir rutas de la API
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Endpoint raiz"""
    return {
        "message": "API de Gestion de Embriones Bovinos",
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }


@app.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Health check con verificacion de base de datos."""
    started = time.perf_counter()
    result = await db.execute(text("SELECT 1"))
    db_ok = result.scalar() == 1
    latency_ms = round((time.perf_counter() - started) * 1000, 2)

    return {
        "status": "healthy" if db_ok else "degraded",
        "database": "ok" if db_ok else "error",
        "latency_ms": latency_ms,
    }
