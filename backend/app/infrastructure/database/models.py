"""
Modelos ORM de SQLAlchemy para la base de datos

Incluye:
- Usuarios y roles
- Donadoras
- Sesiones OPU y extracciones
- Fecundaciones
- Transferencias
- Chequeos GFE
- Drafts (autosave)
"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Date, DateTime,
    Boolean, Text, ForeignKey, Enum, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from .connection import Base


class RolEnum(str, enum.Enum):
    """Roles de usuario"""
    ADMIN = "admin"
    TECNICO = "tecnico"
    LABORATORISTA = "laboratorista"
    VISUALIZADOR = "visualizador"


class EstadoDraft(str, enum.Enum):
    """Estado de los drafts"""
    DRAFT = "draft"
    COMPLETADO = "completado"


# ==================== USUARIOS ====================

class Usuario(Base):
    """Usuarios del sistema con roles"""
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    usuario = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    nombre_completo = Column(String(100), nullable=False)
    rol = Column(String(20), nullable=False, default="visualizador")  # SQLite compatible
    activo = Column(Boolean, default=True, nullable=False)

    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    ultima_conexion = Column(DateTime(timezone=True), nullable=True)

    # Relaciones
    drafts = relationship("Draft", back_populates="usuario")


# ==================== DONADORAS ====================

class Donadora(Base):
    """Vacas donadoras de embriones"""
    __tablename__ = "donadoras"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, index=True)
    numero_registro = Column(String(50), unique=True, nullable=False, index=True)
    raza = Column(String(50), nullable=False)
    tipo_ganado = Column(String(10), nullable=False)  # SQLite compatible: 'carne' o 'leche'
    fecha_nacimiento = Column(Date, nullable=True)
    propietario_nombre = Column(String(100), nullable=False)
    propietario_contacto = Column(String(100), nullable=True)
    foto_ruta = Column(String(500), nullable=True)  # URL de Cloudinary
    foto_thumbnail = Column(String(500), nullable=True)  # URL thumbnail de Cloudinary
    foto_public_id = Column(String(200), nullable=True)  # Public ID de Cloudinary para eliminación
    peso_kg = Column(Float, nullable=True)
    notas = Column(Text, nullable=True)
    activo = Column(Boolean, default=True, nullable=False)

    # Auditoría
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), onupdate=func.now())
    usuario_creacion_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    # Relaciones
    extracciones = relationship("ExtraccionDonadora", back_populates="donadora")


# ==================== SESIONES OPU ====================

class SesionOPU(Base):
    """Sesiones de Ovum Pick Up"""
    __tablename__ = "sesiones_opu"

    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(Date, nullable=False, index=True)
    tecnico_opu = Column(String(100), nullable=False)
    tecnico_busqueda = Column(String(100), nullable=False)
    cliente = Column(String(100), nullable=False)
    medio = Column(String(100), nullable=True)
    receptoras = Column(String(255), nullable=True)
    hacienda = Column(String(100), nullable=True)
    lote = Column(String(50), nullable=True)
    hora_inicio = Column(String(10), nullable=True)  # HH:MM al marcar inicio
    hora_final = Column(String(10), nullable=True)   # HH:MM al marcar fin
    finalidad = Column(String(15), nullable=False)  # SQLite compatible: 'fresco' o 'vitrificado'
    observaciones = Column(Text, nullable=True)

    # Auditoría
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    usuario_creacion_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    # Relaciones
    extracciones_donadoras = relationship("ExtraccionDonadora", back_populates="sesion_opu", cascade="all, delete-orphan")

    @property
    def extracciones(self):
        """
        Alias para compatibilidad con los esquemas de respuesta.
        Pydantic espera 'extracciones', mientras el ORM usa 'extracciones_donadoras'.
        """
        return self.extracciones_donadoras


class ExtraccionDonadora(Base):
    """Detalle de extracción por donadora en una sesión OPU"""
    __tablename__ = "extraccion_donadoras"

    id = Column(Integer, primary_key=True, index=True)
    sesion_opu_id = Column(Integer, ForeignKey("sesiones_opu.id", ondelete="CASCADE"), nullable=False)
    donadora_id = Column(Integer, ForeignKey("donadoras.id"), nullable=False)
    numero_secuencial = Column(Integer, nullable=False)
    hora_inicio = Column(String(10), nullable=True)  # Hora de inicio de extracción
    hora_fin = Column(String(10), nullable=True)     # Hora de fin de extracción
    toro_a = Column(String(100), nullable=True)
    toro_b = Column(String(100), nullable=True)
    raza_toro = Column(String(50), nullable=True)
    ct = Column(String(50), nullable=True)  # Texto corto
    cc = Column(String(50), nullable=True)  # Texto corto
    eo = Column(String(50), nullable=True)  # Texto corto
    prevision_campo = Column(Integer, nullable=True)  # Numérico

    # Resultados de la extracción
    grado_1 = Column(Integer, default=0, nullable=False)
    grado_2 = Column(Integer, default=0, nullable=False)
    grado_3 = Column(Integer, default=0, nullable=False)
    desnudos = Column(Integer, default=0, nullable=False)
    irregular = Column(Integer, default=0, nullable=False)
    observaciones = Column(Text, nullable=True)

    # Fotos de la extraccion (Cloudinary)
    foto_ruta = Column(String(500), nullable=True)
    foto_thumbnail = Column(String(500), nullable=True)
    foto_public_id = Column(String(200), nullable=True)

    # Relaciones
    sesion_opu = relationship("SesionOPU", back_populates="extracciones_donadoras")
    donadora = relationship("Donadora", back_populates="extracciones")
    fecundaciones = relationship("Fecundacion", back_populates="extraccion_donadora")

    @property
    def total_ovocitos(self):
        """Total de ovocitos recuperados"""
        return self.grado_1 + self.grado_2 + self.grado_3 + self.desnudos + self.irregular


# ==================== FECUNDACIÓN ====================

class Fecundacion(Base):
    """Proceso de fertilización in vitro"""
    __tablename__ = "fecundaciones"

    id = Column(Integer, primary_key=True, index=True)
    extraccion_donadora_id = Column(Integer, ForeignKey("extraccion_donadoras.id"), nullable=True)
    donadora_id = Column(Integer, ForeignKey("donadoras.id"), nullable=True)

    # Maduración
    laboratorista = Column(String(100), nullable=False)
    fecha_inicio_maduracion = Column(Date, nullable=False)
    hora_inicio_maduracion = Column(String(10), nullable=True)
    medio_maduracion = Column(String(100), nullable=True)
    temperatura = Column(Float, nullable=True)
    tiempo_maduracion = Column(String(50), nullable=True)

    # Fertilización
    fecha_fertilizacion = Column(Date, nullable=True)
    hora_fertilizacion = Column(String(10), nullable=True)
    semen_utilizado = Column(String(100), nullable=True)
    medio_fertilizacion = Column(String(100), nullable=True)
    concentracion_espermatica = Column(String(100), nullable=True)
    tiempo_coincubacion = Column(String(50), nullable=True)
    foto_microscopica_ruta = Column(String(255), nullable=True)

    # Auditoría
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    usuario_creacion_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    # Relaciones
    extraccion_donadora = relationship("ExtraccionDonadora", back_populates="fecundaciones")
    donadora = relationship("Donadora")


# ==================== TRANSFERENCIA ====================

class SesionTransferencia(Base):
    """Sesiones de transferencia de embriones"""
    __tablename__ = "sesiones_transferencia"

    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(Date, nullable=False, index=True)
    tecnico_transferencia = Column(String(100), nullable=False)
    hora_inicio = Column(String(10), nullable=True)
    hora_final = Column(String(10), nullable=True)
    hacienda = Column(String(100), nullable=True)
    receptoras = Column(String(255), nullable=True)
    cliente = Column(String(100), nullable=False)

    # Auditoría
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    usuario_creacion_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    # Relaciones
    transferencias_realizadas = relationship("TransferenciaRealizada", back_populates="sesion", cascade="all, delete-orphan")


class TransferenciaRealizada(Base):
    """Detalle de transferencias realizadas en una sesión"""
    __tablename__ = "transferencias_realizadas"

    id = Column(Integer, primary_key=True, index=True)
    sesion_transferencia_id = Column(Integer, ForeignKey("sesiones_transferencia.id", ondelete="CASCADE"), nullable=True)
    numero_secuencial = Column(Integer, nullable=False)
    donadora_id = Column(Integer, ForeignKey("donadoras.id"), nullable=True)
    toro = Column(String(100), nullable=True)
    raza_toro = Column(String(50), nullable=True)
    estado = Column(String(50), nullable=True)
    receptora = Column(String(100), nullable=True)
    ciclado_izquierdo = Column(String(50), nullable=True)
    ciclado_derecho = Column(String(50), nullable=True)
    observaciones = Column(Text, nullable=True)
    fecha = Column(Date, nullable=True)
    tecnico_transferencia = Column(String(100), nullable=True)
    cliente = Column(String(100), nullable=True)
    finalidad = Column(String(20), nullable=True)  # 'Fresh' o 'VIT'

    # Relaciones
    sesion = relationship("SesionTransferencia", back_populates="transferencias_realizadas")
    chequeos = relationship("ChequeoGFE", back_populates="transferencia")


# ==================== CHEQUEO GFE ====================

class ChequeoGFE(Base):
    """Chequeos de gestación (GFE)"""
    __tablename__ = "chequeos_gfe"

    id = Column(Integer, primary_key=True, index=True)
    transferencia_id = Column(Integer, ForeignKey("transferencias_realizadas.id"), nullable=True)
    receptora = Column(String(100), nullable=False)
    tecnico_chequeo = Column(String(100), nullable=False)
    hacienda = Column(String(100), nullable=True)
    fecha = Column(Date, nullable=False, index=True)
    hora_inicio = Column(String(10), nullable=True)
    hora_final = Column(String(10), nullable=True)
    cliente = Column(String(100), nullable=False)
    estado = Column(String(10), nullable=False)  # SQLite compatible: 'preñada' o 'vacia'
    nota = Column(Text, nullable=True)

    # Auditoría
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    usuario_creacion_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    # Relaciones
    transferencia = relationship("TransferenciaRealizada", back_populates="chequeos")


# ==================== FOTOS ====================

class Foto(Base):
    """
    Fotos asociadas a diferentes entidades (donadoras, transferencias, etc.)
    Almacena múltiples fotos por entidad usando Cloudinary
    """
    __tablename__ = "fotos"

    id = Column(Integer, primary_key=True, index=True)
    entidad_tipo = Column(String(50), nullable=False, index=True)  # "donadora", "transferencia", etc.
    entidad_id = Column(Integer, nullable=False, index=True)  # ID de la entidad
    orden = Column(Integer, default=0, nullable=False)  # Orden de la foto (0-5)

    # URLs de Cloudinary
    url = Column(String(500), nullable=False)  # URL completa
    thumbnail_url = Column(String(500), nullable=True)  # URL thumbnail
    public_id = Column(String(200), nullable=False)  # Public ID para eliminación

    # Metadata opcional
    descripcion = Column(Text, nullable=True)

    # Auditoría
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    usuario_creacion_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)


# ==================== DRAFTS (AUTOSAVE) ====================

class Draft(Base):
    """
    Borrador para guardar información no confirmada (autosave)

    Permite recuperar formularios sin guardar
    """
    __tablename__ = "drafts"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    modulo = Column(String(50), nullable=False, index=True)  # "donadora", "opu", "fecundacion", etc.
    tipo_registro = Column(String(50), nullable=False)  # "sesion", "detalle", etc.
    registro_id = Column(Integer, nullable=True)  # ID del registro si ya existe
    datos_json = Column(JSON, nullable=False)  # Datos del formulario en JSON
    estado = Column(String(15), default="draft", nullable=False)  # SQLite compatible: 'draft' o 'completado'

    # Timestamps
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), onupdate=func.now())

    # Relaciones
    usuario = relationship("Usuario", back_populates="drafts")
