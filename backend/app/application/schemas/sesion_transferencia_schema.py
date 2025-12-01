"""
Schemas para Sesiones de Transferencia de embriones
"""
from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel, Field

from .transferencia_schema import TransferenciaResponse


class SesionTransferenciaBase(BaseModel):
    fecha: date = Field(..., description="Fecha de la sesión de transferencia")
    tecnico_transferencia: str = Field(..., max_length=100)
    hora_inicio: Optional[str] = Field(None, max_length=10)
    hora_final: Optional[str] = Field(None, max_length=10)
    hacienda: Optional[str] = Field(None, max_length=100)
    receptoras: Optional[str] = Field(None, max_length=255)
    cliente: str = Field(..., max_length=100)


class SesionTransferenciaCreate(SesionTransferenciaBase):
    pass


class SesionTransferenciaUpdate(BaseModel):
    fecha: Optional[date] = None
    tecnico_transferencia: Optional[str] = None
    hora_inicio: Optional[str] = None
    hora_final: Optional[str] = None
    hacienda: Optional[str] = None
    receptoras: Optional[str] = None
    cliente: Optional[str] = None


class SesionTransferenciaResponse(SesionTransferenciaBase):
    id: int
    fecha_creacion: Optional[datetime] = None
    transferencias_realizadas: List[TransferenciaResponse] = []

    class Config:
        from_attributes = True
