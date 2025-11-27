"""
Endpoints para gestión de fecundación (IVF)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List

from app.core.dependencies import get_db, get_current_user
from app.infrastructure.database.models import Fecundacion
from app.infrastructure.repositories.fecundacion_repository import FecundacionRepository
from app.application.schemas.fecundacion_schema import (
    FecundacionCreate,
    FecundacionResponse,
    FecundacionUpdate,
)


router = APIRouter()


@router.post("/", response_model=FecundacionResponse, status_code=status.HTTP_201_CREATED)
async def create_fecundacion(
    fec_data: FecundacionCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Crear registro de fecundación"""
    repo = FecundacionRepository(db)

    fec = Fecundacion(
        **fec_data.model_dump(),
        usuario_creacion_id=current_user.id
    )
    created = await repo.create(fec)
    return created


@router.get("/", response_model=List[FecundacionResponse])
async def list_fecundaciones(
    donadora_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Listar fecundaciones (filtrable por donadora)"""
    repo = FecundacionRepository(db)
    if donadora_id:
        return await repo.get_by_donadora(donadora_id)
    return await repo.get_all(skip, limit)


@router.get("/{fecundacion_id}", response_model=FecundacionResponse)
async def get_fecundacion(
    fecundacion_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    repo = FecundacionRepository(db)
    fec = await repo.get_by_id(fecundacion_id)
    if not fec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fecundación no encontrada")
    return fec


@router.put("/{fecundacion_id}", response_model=FecundacionResponse)
async def update_fecundacion(
    fecundacion_id: int,
    fec_data: FecundacionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    repo = FecundacionRepository(db)
    existing = await repo.get_by_id(fecundacion_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fecundación no encontrada")

    update_data = fec_data.model_dump(exclude_unset=True)
    updated = await repo.update(fecundacion_id, update_data)
    return updated


@router.delete("/{fecundacion_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_fecundacion(
    fecundacion_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    repo = FecundacionRepository(db)
    existing = await repo.get_by_id(fecundacion_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fecundación no encontrada")
    await repo.delete(fecundacion_id)
