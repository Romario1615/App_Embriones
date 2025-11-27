"""
Repositorio base genérico con operaciones CRUD async
"""
from typing import Generic, TypeVar, Type, List, Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import DeclarativeMeta


T = TypeVar('T')


class BaseRepository(Generic[T]):
    """Repositorio base con operaciones CRUD genéricas"""

    def __init__(self, db: AsyncSession, model: Type[T]):
        self.db = db
        self.model = model

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[T]:
        """Obtener todos los registros con paginación"""
        result = await self.db.execute(
            select(self.model).offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def get_by_id(self, id: int) -> Optional[T]:
        """Obtener un registro por ID"""
        result = await self.db.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalar_one_or_none()

    async def create(self, obj: T) -> T:
        """Crear un nuevo registro"""
        self.db.add(obj)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    async def update(self, id: int, data: dict) -> Optional[T]:
        """Actualizar un registro por ID"""
        stmt = (
            update(self.model)
            .where(self.model.id == id)
            .values(**data)
            .execution_options(synchronize_session="fetch")
        )
        await self.db.execute(stmt)
        await self.db.commit()

        return await self.get_by_id(id)

    async def delete(self, id: int) -> bool:
        """Eliminar un registro por ID"""
        stmt = delete(self.model).where(self.model.id == id)
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.rowcount > 0

    async def count(self) -> int:
        """Contar total de registros"""
        from sqlalchemy import func
        result = await self.db.execute(
            select(func.count()).select_from(self.model)
        )
        return result.scalar()
