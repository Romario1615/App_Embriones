"""
Endpoints para sesiones de transferencia
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.infrastructure.database.models import SesionTransferencia
from app.infrastructure.repositories.sesion_transferencia_repository import SesionTransferenciaRepository
from app.application.schemas.sesion_transferencia_schema import (
    SesionTransferenciaCreate,
    SesionTransferenciaUpdate,
    SesionTransferenciaResponse,
)

router = APIRouter()


@router.post("/", response_model=SesionTransferenciaResponse, status_code=status.HTTP_201_CREATED)
async def create_sesion_transferencia(
    data: SesionTransferenciaCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    repo = SesionTransferenciaRepository(db)
    sesion = SesionTransferencia(**data.model_dump())
    created = await repo.create(sesion)
    return created


@router.get("/", response_model=List[SesionTransferenciaResponse])
async def list_sesiones_transferencia(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    repo = SesionTransferenciaRepository(db)
    return await repo.get_all_with_transferencias(skip, limit)


@router.get("/{sesion_id}", response_model=SesionTransferenciaResponse)
async def get_sesion_transferencia(
    sesion_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    repo = SesionTransferenciaRepository(db)
    sesion = await repo.get_by_id_with_transferencias(sesion_id)
    if not sesion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión de transferencia no encontrada")
    return sesion


@router.put("/{sesion_id}", response_model=SesionTransferenciaResponse)
async def update_sesion_transferencia(
    sesion_id: int,
    data: SesionTransferenciaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    repo = SesionTransferenciaRepository(db)
    existing = await repo.get_by_id(sesion_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión de transferencia no encontrada")

    update_data = data.model_dump(exclude_unset=True)
    updated = await repo.update(sesion_id, update_data)
    return updated


@router.delete("/{sesion_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sesion_transferencia(
    sesion_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    repo = SesionTransferenciaRepository(db)
    existing = await repo.get_by_id(sesion_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión de transferencia no encontrada")
    await repo.delete(sesion_id)
