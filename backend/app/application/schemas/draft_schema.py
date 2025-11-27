"""
Schemas Pydantic para Draft (autosave)
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class DraftCreate(BaseModel):
    """Schema para crear un draft"""
    modulo: str = Field(..., min_length=1, max_length=50)
    tipo_registro: str = Field(..., min_length=1, max_length=50)
    registro_id: Optional[int] = None
    datos_json: Dict[str, Any]


class DraftUpdate(BaseModel):
    """Schema para actualizar un draft"""
    datos_json: Dict[str, Any]


class DraftResponse(BaseModel):
    """Schema de respuesta de draft"""
    id: int
    usuario_id: int
    modulo: str
    tipo_registro: str
    registro_id: Optional[int] = None
    datos_json: Dict[str, Any]
    estado: str
    fecha_creacion: datetime
    fecha_actualizacion: Optional[datetime] = None

    class Config:
        from_attributes = True
