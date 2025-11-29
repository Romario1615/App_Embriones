"""
Schemas para sesiones OPU
"""
from pydantic import BaseModel
from typing import Optional, List
from pydantic import Field
from datetime import date, datetime


class ExtraccionBase(BaseModel):
    numero_secuencial: int
    hora_inicio: Optional[str] = None
    hora_fin: Optional[str] = None
    donadora_id: Optional[int] = None
    toro_a: Optional[str] = None
    toro_b: Optional[str] = None
    raza_toro: Optional[str] = None
    ct: Optional[str] = None
    cc: Optional[str] = None
    eo: Optional[str] = None
    prevision_campo: Optional[int] = None
    grado_1: int = 0
    grado_2: int = 0
    grado_3: int = 0
    desnudos: int = 0
    irregular: int = 0
    foto_ruta: Optional[str] = None
    foto_thumbnail: Optional[str] = None
    foto_public_id: Optional[str] = None


class NuevaDonadora(BaseModel):
    nombre: str
    numero_registro: str
    raza: str
    tipo_ganado: str
    propietario_nombre: str


class ExtraccionCreate(ExtraccionBase):
    nueva_donadora: Optional[NuevaDonadora] = None


class ExtraccionUpdate(ExtraccionBase):
    nueva_donadora: Optional[NuevaDonadora] = None


class ExtraccionResponse(ExtraccionBase):
    id: int
    donadora_id: int

    class Config:
        from_attributes = True


class SesionOPUBase(BaseModel):
    fecha: date
    tecnico_opu: str
    tecnico_busqueda: str
    cliente: str
    medio: Optional[str] = None
    receptoras: Optional[str] = None
    hacienda: Optional[str] = None
    lote: Optional[str] = None
    hora_inicio: Optional[str] = None
    hora_final: Optional[str] = None
    finalidad: str  # 'fresco' o 'vitrificado'
    observaciones: Optional[str] = None


class SesionOPUCreate(SesionOPUBase):
    extracciones: List[ExtraccionCreate] = Field(default_factory=list)


class SesionOPUUpdate(BaseModel):
    fecha: Optional[date] = None
    tecnico_opu: Optional[str] = None
    tecnico_busqueda: Optional[str] = None
    cliente: Optional[str] = None
    medio: Optional[str] = None
    receptoras: Optional[str] = None
    hacienda: Optional[str] = None
    lote: Optional[str] = None
    hora_inicio: Optional[str] = None
    hora_final: Optional[str] = None
    finalidad: Optional[str] = None
    observaciones: Optional[str] = None
    extracciones: Optional[List[ExtraccionUpdate]] = None


class SesionOPUResponse(SesionOPUBase):
    id: int
    fecha_creacion: datetime
    usuario_creacion_id: Optional[int]
    extracciones: List[ExtraccionResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True
