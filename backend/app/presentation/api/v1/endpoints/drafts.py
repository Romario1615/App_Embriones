"""
Endpoints para gestión de drafts (autosave)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.dependencies import get_db, get_current_user
from app.infrastructure.repositories.draft_repository import DraftRepository
from app.infrastructure.database.models import Draft
from app.application.schemas.draft_schema import (
    DraftCreate, DraftResponse, DraftUpdate
)


router = APIRouter()


@router.post("/", response_model=DraftResponse, status_code=status.HTTP_201_CREATED)
async def create_or_update_draft(
    draft_data: DraftCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Crear o actualizar draft (autosave)

    Si ya existe un draft para el mismo módulo/tipo/registro, lo actualiza
    """
    repo = DraftRepository(db)

    # Buscar draft existente
    existing = None
    if draft_data.registro_id:
        existing = await repo.get_draft_by_registro(
            current_user.id,
            draft_data.modulo,
            draft_data.registro_id
        )

    if existing:
        # Actualizar existente
        updated = await repo.update(existing.id, {"datos_json": draft_data.datos_json})
        return updated
    else:
        # Crear nuevo
        draft = Draft(
            usuario_id=current_user.id,
            modulo=draft_data.modulo,
            tipo_registro=draft_data.tipo_registro,
            registro_id=draft_data.registro_id,
            datos_json=draft_data.datos_json
        )
        created = await repo.create(draft)
        return created


@router.get("/", response_model=list[DraftResponse])
async def get_user_drafts(
    modulo: Optional[str] = None,
    tipo_registro: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtener drafts del usuario actual"""
    repo = DraftRepository(db)

    if modulo:
        drafts = await repo.get_by_usuario_modulo(
            current_user.id,
            modulo,
            tipo_registro
        )
    else:
        # Obtener todos los drafts del usuario
        from sqlalchemy import select, and_
        from app.infrastructure.database.models import Draft

        result = await db.execute(
            select(Draft).where(
                and_(
                    Draft.usuario_id == current_user.id,
                    Draft.estado == "draft"
                )
            )
        )
        drafts = result.scalars().all()

    return drafts


@router.delete("/{draft_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_draft(
    draft_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Eliminar un draft"""
    repo = DraftRepository(db)

    draft = await repo.get_by_id(draft_id)
    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft no encontrado"
        )

    # Verificar que el draft pertenece al usuario actual
    if draft.usuario_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para eliminar este draft"
        )

    await repo.delete(draft_id)


@router.post("/{draft_id}/complete", status_code=status.HTTP_204_NO_CONTENT)
async def mark_draft_as_completed(
    draft_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Marcar draft como completado"""
    repo = DraftRepository(db)

    draft = await repo.get_by_id(draft_id)
    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft no encontrado"
        )

    if draft.usuario_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para modificar este draft"
        )

    await repo.mark_as_completed(draft_id)
