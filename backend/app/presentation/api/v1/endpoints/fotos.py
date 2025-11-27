"""
Endpoints para gestión de fotos múltiples
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import Optional

from app.core.dependencies import get_db, get_current_user
from app.core.cloudinary_service import upload_image, delete_image
from app.infrastructure.database.models import Foto
from app.application.schemas.foto_schema import FotoResponse, FotosResponse


router = APIRouter()


@router.post("/", response_model=FotoResponse, status_code=status.HTTP_201_CREATED)
async def upload_foto(
    entidad_tipo: str = Form(...),
    entidad_id: int = Form(...),
    orden: int = Form(0),
    descripcion: Optional[str] = Form(None),
    archivo: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Subir una foto para una entidad"""

    # Validar que no exceda el máximo de 6 fotos
    result = await db.execute(
        select(Foto).where(
            Foto.entidad_tipo == entidad_tipo,
            Foto.entidad_id == entidad_id
        )
    )
    fotos_existentes = result.scalars().all()

    if len(fotos_existentes) >= 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Máximo 6 fotos permitidas por entidad"
        )

    # Subir a Cloudinary
    folder = f"{entidad_tipo}s"
    cloudinary_result = await upload_image(archivo, folder=folder)

    # Crear registro en BD
    foto = Foto(
        entidad_tipo=entidad_tipo,
        entidad_id=entidad_id,
        orden=orden,
        url=cloudinary_result["url"],
        thumbnail_url=cloudinary_result["thumbnail_url"],
        public_id=cloudinary_result["public_id"],
        descripcion=descripcion,
        usuario_creacion_id=current_user.id
    )

    db.add(foto)
    await db.commit()
    await db.refresh(foto)

    return foto


@router.get("/{entidad_tipo}/{entidad_id}", response_model=FotosResponse)
async def get_fotos(
    entidad_tipo: str,
    entidad_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtener todas las fotos de una entidad"""
    result = await db.execute(
        select(Foto)
        .where(
            Foto.entidad_tipo == entidad_tipo,
            Foto.entidad_id == entidad_id
        )
        .order_by(Foto.orden, Foto.fecha_creacion)
    )
    fotos = result.scalars().all()

    return {
        "entidad_tipo": entidad_tipo,
        "entidad_id": entidad_id,
        "fotos": fotos,
        "total": len(fotos)
    }


@router.delete("/{foto_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_foto(
    foto_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Eliminar una foto"""
    result = await db.execute(
        select(Foto).where(Foto.id == foto_id)
    )
    foto = result.scalar_one_or_none()

    if not foto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Foto no encontrada"
        )

    # Eliminar de Cloudinary
    await delete_image(foto.public_id)

    # Eliminar de BD
    await db.delete(foto)
    await db.commit()


@router.delete("/{entidad_tipo}/{entidad_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_all_fotos(
    entidad_tipo: str,
    entidad_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Eliminar todas las fotos de una entidad"""
    result = await db.execute(
        select(Foto).where(
            Foto.entidad_tipo == entidad_tipo,
            Foto.entidad_id == entidad_id
        )
    )
    fotos = result.scalars().all()

    # Eliminar cada foto de Cloudinary
    for foto in fotos:
        await delete_image(foto.public_id)

    # Eliminar de BD
    await db.execute(
        delete(Foto).where(
            Foto.entidad_tipo == entidad_tipo,
            Foto.entidad_id == entidad_id
        )
    )
    await db.commit()
