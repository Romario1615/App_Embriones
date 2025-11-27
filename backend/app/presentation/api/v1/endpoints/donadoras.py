"""
Endpoints para gestión de donadoras
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime
import uuid
from pathlib import Path

from app.core.dependencies import get_db, get_current_user
from app.infrastructure.repositories.donadora_repository import DonadoraRepository
from app.infrastructure.database.models import Donadora
from app.application.schemas.donadora_schema import (
    DonadoraCreate, DonadoraResponse, DonadoraUpdate
)


router = APIRouter()


ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _parse_fecha(fecha_str: Optional[str]):
    """Convertir string ISO a date o None"""
    if not fecha_str:
        return None
    try:
        return datetime.strptime(fecha_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de fecha inválido. Usa YYYY-MM-DD"
        )


async def _upload_foto(foto: UploadFile) -> str:
    """Validar y guardar foto localmente; devuelve URL relativa servida en /uploads"""
    if foto.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de imagen no permitido. Usa JPG, PNG o WEBP"
        )

    # Validar tamaño (5MB)
    content = await foto.read()
    if len(content) > 5_242_880:  # 5MB
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La imagen excede el tamaño máximo permitido (5MB)"
        )

    # Guardar en /uploads/donadoras
    uploads_dir = Path(settings.UPLOAD_DIR) / "donadoras"
    uploads_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(foto.filename).suffix.lower() or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    dest_path = uploads_dir / filename

    with open(dest_path, "wb") as f:
        f.write(content)

    # URL expuesta por StaticFiles en /uploads
    return f"/uploads/donadoras/{filename}"


@router.post("/", response_model=DonadoraResponse, status_code=status.HTTP_201_CREATED)
async def create_donadora(
    nombre: str = Form(...),
    numero_registro: str = Form(...),
    raza: str = Form(...),
    tipo_ganado: str = Form(...),
    propietario_nombre: str = Form(...),
    fecha_nacimiento: Optional[str] = Form(None),
    propietario_contacto: Optional[str] = Form(None),
    peso_kg: Optional[float] = Form(None),
    notas: Optional[str] = Form(None),
    foto: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Crear nueva donadora con foto opcional"""
    repo = DonadoraRepository(db)

    # Verificar que no exista el número de registro
    existing = await repo.get_by_numero_registro(numero_registro)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe una donadora con registro {numero_registro}"
        )

    # Subir foto si existe
    foto_ruta = None
    if foto:
        foto_ruta = await _upload_foto(foto)

    # Crear donadora
    donadora = Donadora(
        nombre=nombre,
        numero_registro=numero_registro,
        raza=raza,
        tipo_ganado=tipo_ganado,
        propietario_nombre=propietario_nombre,
        fecha_nacimiento=_parse_fecha(fecha_nacimiento),
        propietario_contacto=propietario_contacto,
        peso_kg=peso_kg,
        notas=notas,
        foto_ruta=foto_ruta,
        usuario_creacion_id=current_user.id
    )

    created = await repo.create(donadora)
    return created


@router.get("/", response_model=list[DonadoraResponse])
async def get_donadoras(
    skip: int = 0,
    limit: int = 100,
    activo: Optional[bool] = None,
    q: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtener todas las donadoras"""
    repo = DonadoraRepository(db)

    if q:
        return await repo.search(q)

    if activo is not None:
        if activo:
            donadoras = await repo.get_active()
        else:
            all_donadoras = await repo.get_all(skip, limit)
            donadoras = [d for d in all_donadoras if not d.activo]
    else:
        donadoras = await repo.get_all(skip, limit)

    return donadoras


@router.get("/{id}", response_model=DonadoraResponse)
async def get_donadora(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtener una donadora por ID"""
    repo = DonadoraRepository(db)
    donadora = await repo.get_by_id(id)

    if not donadora:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donadora no encontrada"
        )

    return donadora


@router.put("/{id}", response_model=DonadoraResponse)
async def update_donadora(
    id: int,
    nombre: Optional[str] = Form(None),
    numero_registro: Optional[str] = Form(None),
    raza: Optional[str] = Form(None),
    tipo_ganado: Optional[str] = Form(None),
    propietario_nombre: Optional[str] = Form(None),
    fecha_nacimiento: Optional[str] = Form(None),
    propietario_contacto: Optional[str] = Form(None),
    peso_kg: Optional[float] = Form(None),
    notas: Optional[str] = Form(None),
    foto: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Actualizar donadora con foto opcional"""
    repo = DonadoraRepository(db)

    donadora = await repo.get_by_id(id)
    if not donadora:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donadora no encontrada"
        )

    # Subir nueva foto si existe
    update_data = {}
    if nombre is not None:
        update_data["nombre"] = nombre
    if numero_registro is not None:
        update_data["numero_registro"] = numero_registro
    if raza is not None:
        update_data["raza"] = raza
    if tipo_ganado is not None:
        update_data["tipo_ganado"] = tipo_ganado
    if propietario_nombre is not None:
        update_data["propietario_nombre"] = propietario_nombre
    if fecha_nacimiento is not None:
        update_data["fecha_nacimiento"] = _parse_fecha(fecha_nacimiento)
    if propietario_contacto is not None:
        update_data["propietario_contacto"] = propietario_contacto
    if peso_kg is not None:
        update_data["peso_kg"] = peso_kg
    if notas is not None:
        update_data["notas"] = notas

    if foto:
        update_data["foto_ruta"] = await _upload_foto(foto)

    updated = await repo.update(id, update_data)

    return updated


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_donadora(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Eliminar donadora (soft delete)"""
    repo = DonadoraRepository(db)

    donadora = await repo.get_by_id(id)
    if not donadora:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donadora no encontrada"
        )

    await repo.update(id, {"activo": False})
 
