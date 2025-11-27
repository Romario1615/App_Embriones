"""
Endpoints para transferencias realizadas
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.core.dependencies import get_db, get_current_user
from app.infrastructure.database.models import TransferenciaRealizada
from app.infrastructure.repositories.transferencia_repository import TransferenciaRepository
from app.application.schemas.transferencia_schema import (
    TransferenciaCreate,
    TransferenciaResponse,
    TransferenciaUpdate,
)


router = APIRouter()


@router.post("/", response_model=TransferenciaResponse, status_code=status.HTTP_201_CREATED)
async def create_transferencia(
    data: TransferenciaCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    repo = TransferenciaRepository(db)

    transferencia = TransferenciaRealizada(**data.model_dump())
    created = await repo.create(transferencia)
    return created


@router.get("/", response_model=List[TransferenciaResponse])
async def list_transferencias(
    donadora_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    repo = TransferenciaRepository(db)
    if donadora_id:
        return await repo.get_by_donadora(donadora_id)
    return await repo.get_all(skip, limit)


@router.get("/{transferencia_id}", response_model=TransferenciaResponse)
async def get_transferencia(
    transferencia_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    repo = TransferenciaRepository(db)
    transferencia = await repo.get_by_id(transferencia_id)
    if not transferencia:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transferencia no encontrada")
    return transferencia


@router.put("/{transferencia_id}", response_model=TransferenciaResponse)
async def update_transferencia(
    transferencia_id: int,
    data: TransferenciaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    repo = TransferenciaRepository(db)
    existing = await repo.get_by_id(transferencia_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transferencia no encontrada")

    update_data = data.model_dump(exclude_unset=True)
    updated = await repo.update(transferencia_id, update_data)
    return updated


@router.delete("/{transferencia_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transferencia(
    transferencia_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    repo = TransferenciaRepository(db)
    existing = await repo.get_by_id(transferencia_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transferencia no encontrada")
    await repo.delete(transferencia_id)
