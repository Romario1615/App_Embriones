"""
Schemas Pydantic para Usuario
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UsuarioBase(BaseModel):
    """Schema base de usuario"""
    usuario: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    nombre_completo: str = Field(..., min_length=1, max_length=100)
    rol: str = Field(..., pattern="^(admin|tecnico|laboratorista|visualizador)$")


class UsuarioCreate(UsuarioBase):
    """Schema para crear usuario"""
    password: str = Field(..., min_length=6)


class UsuarioUpdate(BaseModel):
    """Schema para actualizar usuario (campos opcionales)"""
    nombre_completo: Optional[str] = None
    email: Optional[EmailStr] = None
    rol: Optional[str] = None
    activo: Optional[bool] = None


class UsuarioResponse(UsuarioBase):
    """Schema de respuesta de usuario"""
    id: int
    activo: bool
    fecha_creacion: datetime
    ultima_conexion: Optional[datetime] = None

    class Config:
        from_attributes = True


class UsuarioLogin(BaseModel):
    """Schema para login"""
    usuario: str
    password: str


class Token(BaseModel):
    """Schema de respuesta de token JWT"""
    access_token: str
    token_type: str = "bearer"
    user: UsuarioResponse
