"""
Endpoints para gestión de donadoras
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime

from app.core.config import settings
from app.core.dependencies import get_db, get_current_user
from app.core.cloudinary_service import upload_image, delete_image
from app.infrastructure.repositories.donadora_repository import DonadoraRepository
from app.infrastructure.database.models import Donadora
from app.application.schemas.donadora_schema import (
    DonadoraCreate, DonadoraResponse, DonadoraUpdate
)


router = APIRouter()


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

    # Subir foto a Cloudinary si existe
    foto_ruta = None
    foto_thumbnail = None
    foto_public_id = None
    if foto:
        cloudinary_result = await upload_image(foto, folder="donadoras")
        foto_ruta = cloudinary_result["url"]
        foto_thumbnail = cloudinary_result["thumbnail_url"]
        foto_public_id = cloudinary_result["public_id"]

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
        foto_thumbnail=foto_thumbnail,
        foto_public_id=foto_public_id,
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

    # Subir nueva foto a Cloudinary si existe
    update_data = {}
    if nombre is not None:
        update_data["nombre"] = nombre
    if numero_registro is not None:
        # Solo validar/actualizar si cambia el número de registro
        if numero_registro != donadora.numero_registro:
            existing = await repo.get_by_numero_registro(numero_registro)
            if existing and existing.id != id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Ya existe una donadora con registro {numero_registro}"
                )
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
        # Eliminar foto anterior de Cloudinary si existe
        if donadora.foto_public_id:
            await delete_image(donadora.foto_public_id)

        # Subir nueva foto
        cloudinary_result = await upload_image(foto, folder="donadoras")
        update_data["foto_ruta"] = cloudinary_result["url"]
        update_data["foto_thumbnail"] = cloudinary_result["thumbnail_url"]
        update_data["foto_public_id"] = cloudinary_result["public_id"]

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
 
