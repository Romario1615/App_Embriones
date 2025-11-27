"""
Schemas Pydantic para Fotos
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class FotoBase(BaseModel):
    """Schema base de foto"""
    entidad_tipo: str  # "donadora", "transferencia", etc.
    entidad_id: int
    orden: int = 0
    descripcion: Optional[str] = None


class FotoCreate(BaseModel):
    """Schema para crear foto (con archivo)"""
    entidad_tipo: str
    entidad_id: int
    orden: int = 0
    descripcion: Optional[str] = None


class FotoResponse(FotoBase):
    """Schema de respuesta de foto"""
    id: int
    url: str
    thumbnail_url: Optional[str] = None
    public_id: str
    fecha_creacion: datetime
    usuario_creacion_id: Optional[int] = None

    class Config:
        from_attributes = True


class FotosResponse(BaseModel):
    """Lista de fotos para una entidad"""
    entidad_tipo: str
    entidad_id: int
    fotos: list[FotoResponse]
    total: int
