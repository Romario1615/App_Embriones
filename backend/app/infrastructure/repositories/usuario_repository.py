"""
Repositorio para gestión de usuarios
"""
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database.models import Usuario
from .base_repository import BaseRepository


class UsuarioRepository(BaseRepository[Usuario]):
    """Repositorio específico para usuarios"""

    def __init__(self, db: AsyncSession):
        super().__init__(db, Usuario)

    async def get_by_usuario(self, usuario: str) -> Optional[Usuario]:
        """Obtener usuario por nombre de usuario"""
        result = await self.db.execute(
            select(Usuario).where(Usuario.usuario == usuario)
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[Usuario]:
        """Obtener usuario por email"""
        result = await self.db.execute(
            select(Usuario).where(Usuario.email == email)
        )
        return result.scalar_one_or_none()

    async def get_active_users(self):
        """Obtener solo usuarios activos"""
        result = await self.db.execute(
            select(Usuario).where(Usuario.activo == True)
        )
        return result.scalars().all()

    async def update_last_login(self, user_id: int):
        """Actualizar última conexión del usuario"""
        from datetime import datetime
        await self.update(user_id, {"ultima_conexion": datetime.utcnow()})
