"""
Repositorio para gestión de donadoras
"""
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database.models import Donadora
from .base_repository import BaseRepository


class DonadoraRepository(BaseRepository[Donadora]):
    """Repositorio específico para donadoras"""

    def __init__(self, db: AsyncSession):
        super().__init__(db, Donadora)

    async def get_by_numero_registro(self, numero: str) -> Optional[Donadora]:
        """Obtener donadora por número de registro"""
        result = await self.db.execute(
            select(Donadora).where(Donadora.numero_registro == numero)
        )
        return result.scalar_one_or_none()

    async def get_by_raza(self, raza: str) -> List[Donadora]:
        """Filtrar donadoras por raza"""
        result = await self.db.execute(
            select(Donadora).where(Donadora.raza == raza)
        )
        return result.scalars().all()

    async def get_active(self) -> List[Donadora]:
        """Obtener solo donadoras activas"""
        result = await self.db.execute(
            select(Donadora).where(Donadora.activo == True)
        )
        return result.scalars().all()

    async def search(self, query: str) -> List[Donadora]:
        """Buscar donadoras por nombre o número de registro"""
        result = await self.db.execute(
            select(Donadora).where(
                (Donadora.nombre.ilike(f"%{query}%")) |
                (Donadora.numero_registro.ilike(f"%{query}%"))
            )
        )
        return result.scalars().all()
