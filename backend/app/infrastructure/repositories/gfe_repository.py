"""
Repositorio para chequeos GFE
"""
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database.models import ChequeoGFE
from .base_repository import BaseRepository


class GFERepository(BaseRepository[ChequeoGFE]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, ChequeoGFE)

    async def get_by_receptora(self, receptora: str) -> List[ChequeoGFE]:
        result = await self.db.execute(
            select(ChequeoGFE).where(ChequeoGFE.receptora.ilike(f"%{receptora}%"))
        )
        return result.scalars().all()
