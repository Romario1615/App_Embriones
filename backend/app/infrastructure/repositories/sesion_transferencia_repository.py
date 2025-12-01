"""
Repositorio para sesiones de transferencia
"""
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..database.models import SesionTransferencia
from .base_repository import BaseRepository


class SesionTransferenciaRepository(BaseRepository[SesionTransferencia]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, SesionTransferencia)

    async def get_all_with_transferencias(self, skip: int = 0, limit: int = 100) -> List[SesionTransferencia]:
        result = await self.db.execute(
            select(SesionTransferencia)
            .options(selectinload(SesionTransferencia.transferencias_realizadas))
            .offset(skip)
            .limit(limit)
            .order_by(SesionTransferencia.fecha.desc())
        )
        return result.scalars().all()

    async def get_by_id_with_transferencias(self, sesion_id: int) -> Optional[SesionTransferencia]:
        result = await self.db.execute(
            select(SesionTransferencia)
            .options(selectinload(SesionTransferencia.transferencias_realizadas))
            .where(SesionTransferencia.id == sesion_id)
        )
        return result.scalar_one_or_none()
