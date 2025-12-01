"""
Router principal de la API v1
"""
from fastapi import APIRouter

from .endpoints import auth, donadoras, drafts, opu, fecundacion, transferencia, gfe, fotos, sesion_transferencia


api_router = APIRouter()

# Incluir routers de cada módulo
api_router.include_router(auth.router, prefix="/auth", tags=["Autenticación"])
api_router.include_router(donadoras.router, prefix="/donadoras", tags=["Donadoras"])
api_router.include_router(drafts.router, prefix="/drafts", tags=["Drafts (Autosave)"])
api_router.include_router(opu.router, prefix="/opu", tags=["OPU"])
api_router.include_router(fecundacion.router, prefix="/fecundacion", tags=["Fecundación"])
api_router.include_router(transferencia.router, prefix="/transferencia", tags=["Transferencia"])
api_router.include_router(sesion_transferencia.router, prefix="/sesion-transferencia", tags=["Sesión Transferencia"])
api_router.include_router(gfe.router, prefix="/gfe", tags=["GFE"])
api_router.include_router(fotos.router, prefix="/fotos", tags=["Fotos"])
