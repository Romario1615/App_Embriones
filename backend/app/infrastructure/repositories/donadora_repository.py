"""
Repositorio para gestión de donadoras
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

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

    async def get_with_filters(
        self,
        skip: int = 0,
        limit: int = 30,
        activo: Optional[bool] = None,
        raza: Optional[str] = None,
        tipo_ganado: Optional[str] = None,
        propietario_nombre: Optional[str] = None,
        search_query: Optional[str] = None
    ) -> tuple[List[Donadora], int]:
        """
        Obtener donadoras con filtros avanzados y contar total
        Retorna: (lista de donadoras, total de registros)
        """
        # Construir query base
        query = select(Donadora)
        count_query = select(func.count(Donadora.id))

        # Aplicar filtros
        filters = []
        if activo is not None:
            filters.append(Donadora.activo == activo)
        if raza:
            filters.append(Donadora.raza == raza)
        if tipo_ganado:
            filters.append(Donadora.tipo_ganado == tipo_ganado)
        if propietario_nombre:
            filters.append(Donadora.propietario_nombre.ilike(f"%{propietario_nombre}%"))
        if search_query:
            filters.append(
                (Donadora.nombre.ilike(f"%{search_query}%")) |
                (Donadora.numero_registro.ilike(f"%{search_query}%"))
            )

        if filters:
            query = query.where(and_(*filters))
            count_query = count_query.where(and_(*filters))

        # Ordenar por fecha de creación descendente
        query = query.order_by(Donadora.fecha_creacion.desc())

        # Aplicar paginación
        query = query.offset(skip).limit(limit)

        # Ejecutar queries
        result = await self.db.execute(query)
        donadoras = result.scalars().all()

        count_result = await self.db.execute(count_query)
        total = count_result.scalar()

        return list(donadoras), total

    async def get_statistics(self) -> Dict[str, Any]:
        """Obtener estadísticas generales de donadoras"""

        # Total de donadoras activas
        total_activas = await self.db.execute(
            select(func.count(Donadora.id)).where(Donadora.activo == True)
        )
        total_activas = total_activas.scalar()

        # Total de donadoras inactivas
        total_inactivas = await self.db.execute(
            select(func.count(Donadora.id)).where(Donadora.activo == False)
        )
        total_inactivas = total_inactivas.scalar()

        # Contar por raza
        por_raza = await self.db.execute(
            select(
                Donadora.raza,
                func.count(Donadora.id).label('count')
            )
            .where(Donadora.activo == True)
            .group_by(Donadora.raza)
        )
        por_raza_dict = {row.raza: row.count for row in por_raza.all()}

        # Contar por tipo de ganado
        por_tipo = await self.db.execute(
            select(
                Donadora.tipo_ganado,
                func.count(Donadora.id).label('count')
            )
            .where(Donadora.activo == True)
            .group_by(Donadora.tipo_ganado)
        )
        por_tipo_dict = {row.tipo_ganado: row.count for row in por_tipo.all()}

        # Contar por propietario (top 10)
        por_propietario = await self.db.execute(
            select(
                Donadora.propietario_nombre,
                func.count(Donadora.id).label('count')
            )
            .where(Donadora.activo == True)
            .group_by(Donadora.propietario_nombre)
            .order_by(func.count(Donadora.id).desc())
            .limit(10)
        )
        por_propietario_list = [
            {"nombre": row.propietario_nombre, "count": row.count}
            for row in por_propietario.all()
        ]

        return {
            "total_activas": total_activas,
            "total_inactivas": total_inactivas,
            "total": total_activas + total_inactivas,
            "por_raza": por_raza_dict,
            "por_tipo_ganado": por_tipo_dict,
            "por_propietario": por_propietario_list
        }

    async def get_all_for_export(self, activo: Optional[bool] = None) -> List[Donadora]:
        """Obtener todas las donadoras para exportación (sin límite)"""
        query = select(Donadora)

        if activo is not None:
            query = query.where(Donadora.activo == activo)

        query = query.order_by(Donadora.fecha_creacion.desc())

        result = await self.db.execute(query)
        return result.scalars().all()
