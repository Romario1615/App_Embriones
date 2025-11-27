"""
Repositorio para gestión de drafts (autosave)
"""
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from ..database.models import Draft
from .base_repository import BaseRepository


class DraftRepository(BaseRepository[Draft]):
    """Repositorio para drafts (borrador autosave)"""

    def __init__(self, db: AsyncSession):
        super().__init__(db, Draft)

    async def get_by_usuario_modulo(
        self,
        usuario_id: int,
        modulo: str,
        tipo_registro: Optional[str] = None
    ) -> List[Draft]:
        """
        Obtener drafts de un usuario para un módulo específico

        Args:
            usuario_id: ID del usuario
            modulo: Módulo ("donadora", "opu", "fecundacion", etc.)
            tipo_registro: Opcional - filtrar por tipo ("sesion", "detalle", etc.)
        """
        query = select(Draft).where(
            and_(
                Draft.usuario_id == usuario_id,
                Draft.modulo == modulo,
                Draft.estado == "draft"
            )
        )

        if tipo_registro:
            query = query.where(Draft.tipo_registro == tipo_registro)

        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_draft_by_registro(
        self,
        usuario_id: int,
        modulo: str,
        registro_id: int
    ) -> Optional[Draft]:
        """Obtener draft de un registro específico"""
        result = await self.db.execute(
            select(Draft).where(
                and_(
                    Draft.usuario_id == usuario_id,
                    Draft.modulo == modulo,
                    Draft.registro_id == registro_id,
                    Draft.estado == "draft"
                )
            )
        )
        return result.scalar_one_or_none()

    async def mark_as_completed(self, draft_id: int):
        """Marcar draft como completado"""
        await self.update(draft_id, {"estado": "completado"})

    async def delete_user_drafts(self, usuario_id: int, modulo: str):
        """Eliminar todos los drafts de un usuario en un módulo"""
        from sqlalchemy import delete as sql_delete

        stmt = sql_delete(Draft).where(
            and_(
                Draft.usuario_id == usuario_id,
                Draft.modulo == modulo
            )
        )
        await self.db.execute(stmt)
        await self.db.commit()
