"""
Script para inicializar la base de datos con datos iniciales

Crea:
- Tablas de la base de datos
- Usuario administrador por defecto

Ejecutar:
    python init_db.py
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.connection import engine, Base, AsyncSessionLocal
from app.infrastructure.database.models import Usuario
from app.core.security import get_password_hash


async def init_database():
    """Inicializar base de datos"""
    print("[*] Creando tablas...")

    async with engine.begin() as conn:
        # Eliminar todas las tablas (¡CUIDADO en producción!)
        await conn.run_sync(Base.metadata.drop_all)
        # Crear todas las tablas
        await conn.run_sync(Base.metadata.create_all)

    print("[OK] Tablas creadas exitosamente")

    # Crear usuario administrador por defecto
    async with AsyncSessionLocal() as db:
        # Verificar si ya existe
        from sqlalchemy import select

        result = await db.execute(
            select(Usuario).where(Usuario.usuario == "admin")
        )
        existing_admin = result.scalar_one_or_none()

        if not existing_admin:
            admin = Usuario(
                usuario="admin",
                email="admin@embriones.com",
                password_hash=get_password_hash("admin123"),
                nombre_completo="Administrador del Sistema",
                rol="admin",
                activo=True
            )

            db.add(admin)
            await db.commit()

            print("[OK] Usuario administrador creado:")
            print("   Usuario: admin")
            print("   Contrasena: admin123")
            print("   [!] CAMBIAR CONTRASENA EN PRODUCCION")
        else:
            print("[i] Usuario administrador ya existe")

    print("\n[OK] Base de datos inicializada correctamente")


if __name__ == "__main__":
    asyncio.run(init_database())
