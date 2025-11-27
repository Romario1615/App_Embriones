"""
Endpoints para gestión de sesiones OPU
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.dependencies import get_db, get_current_user
from app.infrastructure.repositories.opu_repository import OPURepository
from app.infrastructure.database.models import SesionOPU
from app.application.schemas.opu_schema import (
    SesionOPUCreate, SesionOPUResponse, SesionOPUUpdate
)


router = APIRouter()


@router.post("/", response_model=SesionOPUResponse, status_code=status.HTTP_201_CREATED)
async def create_sesion_opu(
    sesion_data: SesionOPUCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Crear nueva sesión OPU con extracciones por donadora"""
    repo = OPURepository(db)

    payload = sesion_data.model_dump()
    extracciones = payload.pop("extracciones", [])

    sesion = SesionOPU(
        **payload,
        usuario_creacion_id=current_user.id
    )

    created = await repo.create_with_extracciones(sesion, extracciones)
    return created


@router.get("/", response_model=List[SesionOPUResponse])
async def get_sesiones_opu(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtener todas las sesiones OPU"""
    repo = OPURepository(db)
    sesiones = await repo.get_all(skip, limit)
    return sesiones


@router.get("/{id}", response_model=SesionOPUResponse)
async def get_sesion_opu(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtener una sesión OPU por ID"""
    repo = OPURepository(db)
    sesion = await repo.get_by_id(id)

    if not sesion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sesión OPU no encontrada"
        )

    return sesion


@router.put("/{id}", response_model=SesionOPUResponse)
async def update_sesion_opu(
    id: int,
    sesion_data: SesionOPUUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Actualizar sesión OPU (reemplaza extracciones si se envían)"""
    repo = OPURepository(db)

    sesion = await repo.get_by_id(id)
    if not sesion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sesión OPU no encontrada"
        )

    payload = sesion_data.model_dump(exclude_unset=True)
    extracciones = payload.pop("extracciones", None)

    updated = await repo.update(sesion, payload, extracciones)

    return updated


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sesion_opu(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Eliminar sesión OPU"""
    repo = OPURepository(db)

    sesion = await repo.get_by_id(id)
    if not sesion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sesión OPU no encontrada"
        )

    await repo.delete(sesion)
