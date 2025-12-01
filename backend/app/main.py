"""
Aplicación principal FastAPI
Sistema de Gestión de Embriones Bovinos
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from .core.config import settings
from .infrastructure.database.connection import init_db, close_db
from .presentation.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Eventos de ciclo de vida de la aplicación

    Se ejecuta al iniciar y cerrar la aplicación
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


# Crear aplicación FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API REST para gestión de transferencia de embriones bovinos",
    lifespan=lifespan
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

# Montar archivos estáticos (uploads)
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
    """Endpoint raíz"""
    return {
        "message": "API de Gestión de Embriones Bovinos",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
