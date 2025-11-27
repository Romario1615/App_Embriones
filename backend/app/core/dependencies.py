"""
Dependency Injection para FastAPI
"""
from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from ..infrastructure.database.connection import AsyncSessionLocal
from ..infrastructure.repositories.usuario_repository import UsuarioRepository
from .security import decode_access_token


# OAuth2 scheme para extraer token del header Authorization
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_db() -> Generator[AsyncSession, None, None]:
    """
    Dependency para obtener sesión de base de datos

    Uso:
        @app.get("/items")
        async def get_items(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    """
    Dependency para obtener usuario actual autenticado

    Extrae el token JWT, lo valida y retorna el usuario

    Raises:
        HTTPException: Si el token es inválido o el usuario no existe
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Decodificar token
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id: Optional[int] = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    # Obtener usuario de la BD
    usuario_repo = UsuarioRepository(db)
    user = await usuario_repo.get_by_id(int(user_id))

    if user is None:
        raise credentials_exception

    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )

    return user


async def get_current_active_admin(
    current_user = Depends(get_current_user)
):
    """
    Dependency para verificar que el usuario actual es administrador

    Uso:
        @app.delete("/users/{id}")
        async def delete_user(
            id: int,
            admin = Depends(get_current_active_admin)
        ):
            ...
    """
    if current_user.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos de administrador"
        )
    return current_user
