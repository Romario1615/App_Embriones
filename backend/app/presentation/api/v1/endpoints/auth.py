"""
Endpoints de autenticación y gestión de usuarios
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user, get_current_active_admin
from app.core.security import verify_password, get_password_hash, create_access_token
from app.infrastructure.repositories.usuario_repository import UsuarioRepository
from app.infrastructure.database.models import Usuario
from app.application.schemas.usuario_schema import (
    UsuarioCreate, UsuarioResponse, UsuarioUpdate, Token
)


router = APIRouter()


@router.post("/register", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
async def register(
    usuario_data: UsuarioCreate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_active_admin)  # Solo admins pueden crear usuarios
):
    """Registrar nuevo usuario (solo administradores)"""
    repo = UsuarioRepository(db)

    # Verificar que no exista el usuario
    existing = await repo.get_by_usuario(usuario_data.usuario)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario ya existe"
        )

    # Verificar email
    existing_email = await repo.get_by_email(usuario_data.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )

    # Crear usuario
    usuario = Usuario(
        usuario=usuario_data.usuario,
        email=usuario_data.email,
        password_hash=get_password_hash(usuario_data.password),
        nombre_completo=usuario_data.nombre_completo,
        rol=usuario_data.rol
    )

    created = await repo.create(usuario)
    return created


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Login de usuario"""
    repo = UsuarioRepository(db)

    # Buscar usuario
    user = await repo.get_by_usuario(form_data.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verificar password
    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verificar que esté activo
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )

    # Actualizar última conexión
    await repo.update_last_login(user.id)

    # Crear token
    access_token = create_access_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UsuarioResponse)
async def get_current_user_info(current_user: Usuario = Depends(get_current_user)):
    """Obtener información del usuario actual"""
    return current_user


@router.get("/users", response_model=list[UsuarioResponse])
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_active_admin)
):
    """Obtener todos los usuarios (solo administradores)"""
    repo = UsuarioRepository(db)
    users = await repo.get_all()
    return users


@router.put("/users/{user_id}", response_model=UsuarioResponse)
async def update_user(
    user_id: int,
    user_data: UsuarioUpdate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_active_admin)
):
    """Actualizar usuario (solo administradores)"""
    repo = UsuarioRepository(db)

    user = await repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    update_data = user_data.model_dump(exclude_unset=True)
    updated = await repo.update(user_id, update_data)

    return updated
