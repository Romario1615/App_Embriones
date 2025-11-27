"""
Schemas Pydantic para Donadora
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime


class DonadoraBase(BaseModel):
    """Schema base de donadora"""
    nombre: str = Field(..., min_length=1, max_length=100)
    numero_registro: str = Field(..., min_length=1, max_length=50)
    raza: str
    tipo_ganado: str = Field(..., pattern="^(carne|leche)$")
    fecha_nacimiento: Optional[date] = None
    propietario_nombre: str
    propietario_contacto: Optional[str] = None
    peso_kg: Optional[float] = Field(None, gt=0)
    notas: Optional[str] = None


class DonadoraCreate(DonadoraBase):
    """Schema para crear donadora"""
    pass


class DonadoraUpdate(BaseModel):
    """Schema para actualizar donadora"""
    nombre: Optional[str] = None
    raza: Optional[str] = None
    tipo_ganado: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    propietario_nombre: Optional[str] = None
    propietario_contacto: Optional[str] = None
    peso_kg: Optional[float] = None
    notas: Optional[str] = None


class DonadoraResponse(DonadoraBase):
    """Schema de respuesta de donadora"""
    id: int
    foto_ruta: Optional[str] = None
    foto_thumbnail: Optional[str] = None
    foto_public_id: Optional[str] = None
    activo: bool
    fecha_creacion: datetime
    fecha_actualizacion: Optional[datetime] = None

    class Config:
        from_attributes = True
