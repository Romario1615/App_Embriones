"""
Schemas para Fecundación (IVF)
"""
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class FecundacionBase(BaseModel):
    donadora_id: Optional[int] = Field(None, description="ID de la donadora")
    extraccion_donadora_id: Optional[int] = Field(
        None, description="ID de la extracción OPU asociada"
    )
    laboratorista: str
    fecha_inicio_maduracion: date
    hora_inicio_maduracion: Optional[str] = None
    medio_maduracion: Optional[str] = None
    temperatura: Optional[float] = None
    tiempo_maduracion: Optional[str] = None
    fecha_fertilizacion: Optional[date] = None
    hora_fertilizacion: Optional[str] = None
    semen_utilizado: Optional[str] = None
    medio_fertilizacion: Optional[str] = None
    concentracion_espermatica: Optional[str] = None
    tiempo_coincubacion: Optional[str] = None
    foto_microscopica_ruta: Optional[str] = None


class FecundacionCreate(FecundacionBase):
    pass


class FecundacionUpdate(BaseModel):
    donadora_id: Optional[int] = None
    extraccion_donadora_id: Optional[int] = None
    laboratorista: Optional[str] = None
    fecha_inicio_maduracion: Optional[date] = None
    hora_inicio_maduracion: Optional[str] = None
    medio_maduracion: Optional[str] = None
    temperatura: Optional[float] = None
    tiempo_maduracion: Optional[str] = None
    fecha_fertilizacion: Optional[date] = None
    hora_fertilizacion: Optional[str] = None
    semen_utilizado: Optional[str] = None
    medio_fertilizacion: Optional[str] = None
    concentracion_espermatica: Optional[str] = None
    tiempo_coincubacion: Optional[str] = None
    foto_microscopica_ruta: Optional[str] = None


class FecundacionResponse(FecundacionBase):
    id: int
    fecha_creacion: datetime
    usuario_creacion_id: Optional[int] = None

    class Config:
        from_attributes = True
