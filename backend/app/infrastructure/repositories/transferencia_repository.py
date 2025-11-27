"""
Repositorio para transferencias realizadas
"""
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database.models import TransferenciaRealizada
from .base_repository import BaseRepository


class TransferenciaRepository(BaseRepository[TransferenciaRealizada]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, TransferenciaRealizada)

    async def get_by_donadora(self, donadora_id: int) -> List[TransferenciaRealizada]:
        result = await self.db.execute(
            select(TransferenciaRealizada).where(TransferenciaRealizada.donadora_id == donadora_id)
        )
        return result.scalars().all()
