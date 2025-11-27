"""
Schemas para Chequeos GFE
"""
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class GFBase(BaseModel):
    transferencia_id: Optional[int] = Field(None, description="ID de la transferencia asociada")
    receptora: str
    tecnico_chequeo: str
    hacienda: Optional[str] = None
    fecha: date
    hora_inicio: Optional[str] = None
    hora_final: Optional[str] = None
    cliente: str
    estado: str  # preñada | vacia
    nota: Optional[str] = None


class GFECreate(GFBase):
    pass


class GFEUpdate(BaseModel):
    transferencia_id: Optional[int] = None
    receptora: Optional[str] = None
    tecnico_chequeo: Optional[str] = None
    hacienda: Optional[str] = None
    fecha: Optional[date] = None
    hora_inicio: Optional[str] = None
    hora_final: Optional[str] = None
    cliente: Optional[str] = None
    estado: Optional[str] = None
    nota: Optional[str] = None


class GFEResponse(GFBase):
    id: int
    fecha_creacion: Optional[datetime] = None

    class Config:
        from_attributes = True
