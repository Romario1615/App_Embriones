"""
Schemas para Transferencias de embriones
"""
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field


class TransferenciaBase(BaseModel):
    sesion_transferencia_id: Optional[int] = Field(
        None, description="ID de la sesion de transferencia (opcional)"
    )
    numero_secuencial: int = Field(..., ge=1)
    fecha: Optional[date] = None
    tecnico_transferencia: Optional[str] = None
    cliente: Optional[str] = None
    finalidad: Optional[str] = None  # Fresh o VIT
    donadora_id: Optional[int] = None
    toro: Optional[str] = None
    raza_toro: Optional[str] = None
    estado: Optional[str] = None
    receptora: Optional[str] = None
    ciclado_izquierdo: Optional[str] = None
    ciclado_derecho: Optional[str] = None
    observaciones: Optional[str] = None


class TransferenciaCreate(TransferenciaBase):
    pass


class TransferenciaUpdate(BaseModel):
    sesion_transferencia_id: Optional[int] = None
    numero_secuencial: Optional[int] = Field(None, ge=1)
    fecha: Optional[date] = None
    tecnico_transferencia: Optional[str] = None
    cliente: Optional[str] = None
    finalidad: Optional[str] = None
    donadora_id: Optional[int] = None
    toro: Optional[str] = None
    raza_toro: Optional[str] = None
    estado: Optional[str] = None
    receptora: Optional[str] = None
    ciclado_izquierdo: Optional[str] = None
    ciclado_derecho: Optional[str] = None
    observaciones: Optional[str] = None


class TransferenciaResponse(TransferenciaBase):
    id: int
    fecha_creacion: Optional[datetime] = None

    class Config:
        from_attributes = True

