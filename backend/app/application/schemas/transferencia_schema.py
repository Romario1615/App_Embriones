"""
Schemas para Transferencias de embriones
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class TransferenciaBase(BaseModel):
    sesion_transferencia_id: Optional[int] = Field(
        None, description="ID de la sesión de transferencia (opcional)"
    )
    numero_secuencial: int = Field(..., ge=1)
    donadora_id: Optional[int] = None
    toro: Optional[str] = None
    raza_toro: Optional[str] = None
    estadio: Optional[str] = None
    receptora: Optional[str] = None
    ciclado_izquierdo: Optional[str] = None
    ciclado_derecho: Optional[str] = None
    observaciones: Optional[str] = None


class TransferenciaCreate(TransferenciaBase):
    pass


class TransferenciaUpdate(BaseModel):
    sesion_transferencia_id: Optional[int] = None
    numero_secuencial: Optional[int] = Field(None, ge=1)
    donadora_id: Optional[int] = None
    toro: Optional[str] = None
    raza_toro: Optional[str] = None
    estadio: Optional[str] = None
    receptora: Optional[str] = None
    ciclado_izquierdo: Optional[str] = None
    ciclado_derecho: Optional[str] = None
    observaciones: Optional[str] = None


class TransferenciaResponse(TransferenciaBase):
    id: int
    fecha_creacion: Optional[datetime] = None

    class Config:
        from_attributes = True
