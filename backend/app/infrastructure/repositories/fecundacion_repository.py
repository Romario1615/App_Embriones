"""
Repositorio para gestión de fecundaciones (IVF)
"""
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database.models import Fecundacion
from .base_repository import BaseRepository


class FecundacionRepository(BaseRepository[Fecundacion]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Fecundacion)

    async def get_by_donadora(self, donadora_id: int) -> List[Fecundacion]:
        result = await self.db.execute(
            select(Fecundacion).where(Fecundacion.donadora_id == donadora_id)
        )
        return result.scalars().all()
