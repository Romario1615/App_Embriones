"""
Endpoints para chequeos GFE
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.core.dependencies import get_db, get_current_user
from app.infrastructure.database.models import ChequeoGFE
from app.infrastructure.repositories.gfe_repository import GFERepository
from app.application.schemas.gfe_schema import GFECreate, GFEResponse, GFEUpdate


router = APIRouter()


@router.post("/", response_model=GFEResponse, status_code=status.HTTP_201_CREATED)
async def create_gfe(
    data: GFECreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    repo = GFERepository(db)
    gfe = ChequeoGFE(**data.model_dump(), usuario_creacion_id=current_user.id)
    created = await repo.create(gfe)
    return created


@router.get("/", response_model=List[GFEResponse])
async def list_gfe(
    receptora: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    repo = GFERepository(db)
    if receptora:
        return await repo.get_by_receptora(receptora)
    return await repo.get_all(skip, limit)


@router.get("/{gfe_id}", response_model=GFEResponse)
async def get_gfe(
    gfe_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    repo = GFERepository(db)
    record = await repo.get_by_id(gfe_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chequeo GFE no encontrado")
    return record


@router.put("/{gfe_id}", response_model=GFEResponse)
async def update_gfe(
    gfe_id: int,
    data: GFEUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    repo = GFERepository(db)
    existing = await repo.get_by_id(gfe_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chequeo GFE no encontrado")

    update_data = data.model_dump(exclude_unset=True)
    updated = await repo.update(gfe_id, update_data)
    return updated


@router.delete("/{gfe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_gfe(
    gfe_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    repo = GFERepository(db)
    existing = await repo.get_by_id(gfe_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chequeo GFE no encontrado")
    await repo.delete(gfe_id)
