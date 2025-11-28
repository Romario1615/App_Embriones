"""
Repository para gestión de sesiones OPU y extracciones
"""
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..database.models import SesionOPU, ExtraccionDonadora, Donadora
from .donadora_repository import DonadoraRepository


class OPURepository:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.donadora_repo = DonadoraRepository(db)

    async def _load_with_extracciones(self, sesion_id: int) -> Optional[SesionOPU]:
        """Cargar sesión con extracciones usando selectinload para evitar lazy en serialización"""
        result = await self.db.execute(
            select(SesionOPU)
            .options(selectinload(SesionOPU.extracciones_donadoras))
            .where(SesionOPU.id == sesion_id)
        )
        return result.scalar_one_or_none()

    async def _resolve_donadora_id(self, extraccion_data: dict) -> int:
        """
        Obtiene el id de donadora; si viene nueva_donadora la crea.
        """
        if extraccion_data.get("donadora_id"):
            return extraccion_data["donadora_id"]

        nueva = extraccion_data.get("nueva_donadora")
        if not nueva:
            raise ValueError("Se requiere donadora_id o datos de nueva donadora")

        existente = await self.donadora_repo.get_by_numero_registro(nueva["numero_registro"])
        if existente:
            return existente.id

        donadora = Donadora(
            nombre=nueva["nombre"],
            numero_registro=nueva["numero_registro"],
            raza=nueva["raza"],
            tipo_ganado=nueva["tipo_ganado"],
            propietario_nombre=nueva["propietario_nombre"],
            activo=True,
        )
        creada = await self.donadora_repo.create(donadora)
        return creada.id

    async def create_with_extracciones(self, sesion: SesionOPU, extracciones: List[dict]) -> SesionOPU:
        """Crear sesión OPU y extracciones asociadas"""
        self.db.add(sesion)
        await self.db.flush()  # para obtener sesion.id

        for ext in extracciones:
            donadora_id = await self._resolve_donadora_id(ext)
            nueva_ext = ExtraccionDonadora(
                sesion_opu_id=sesion.id,
                donadora_id=donadora_id,
                numero_secuencial=ext["numero_secuencial"],
                hora_inicio=ext.get("hora_inicio"),
                hora_fin=ext.get("hora_fin"),
                toro_a=ext.get("toro_a"),
                toro_b=ext.get("toro_b"),
                raza_toro=ext.get("raza_toro"),
                ct=ext.get("ct"),
                cc=ext.get("cc"),
                eo=ext.get("eo"),
                prevision_campo=ext.get("prevision_campo"),
                grado_1=ext.get("grado_1", 0),
                grado_2=ext.get("grado_2", 0),
                grado_3=ext.get("grado_3", 0),
                desnudos=ext.get("desnudos", 0),
                irregular=ext.get("irregular", 0),
            )
            self.db.add(nueva_ext)

        await self.db.commit()
        # Volver a cargar con extracciones para evitar lazy load en la respuesta
        return await self._load_with_extracciones(sesion.id)

    async def get_by_id(self, sesion_id: int) -> Optional[SesionOPU]:
        """Obtener sesión por ID con extracciones"""
        result = await self.db.execute(
            select(SesionOPU)
            .options(selectinload(SesionOPU.extracciones_donadoras))
            .where(SesionOPU.id == sesion_id)
        )
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[SesionOPU]:
        """Obtener todas las sesiones con extracciones"""
        result = await self.db.execute(
            select(SesionOPU)
            .options(selectinload(SesionOPU.extracciones_donadoras))
            .offset(skip)
            .limit(limit)
            .order_by(SesionOPU.fecha.desc())
        )
        return result.scalars().all()

    async def update(self, sesion: SesionOPU, data: dict, extracciones: Optional[List[dict]] = None) -> SesionOPU:
        """Actualizar sesión y, si se envían, reemplazar extracciones"""
        for key, value in data.items():
            setattr(sesion, key, value)

        if extracciones is not None:
            sesion.extracciones_donadoras.clear()
            await self.db.flush()
            for ext in extracciones:
                donadora_id = await self._resolve_donadora_id(ext)
                nueva_ext = ExtraccionDonadora(
                    sesion_opu_id=sesion.id,
                donadora_id=donadora_id,
                numero_secuencial=ext["numero_secuencial"],
                hora_inicio=ext.get("hora_inicio"),
                hora_fin=ext.get("hora_fin"),
                toro_a=ext.get("toro_a"),
                toro_b=ext.get("toro_b"),
                raza_toro=ext.get("raza_toro"),
                ct=ext.get("ct"),
                cc=ext.get("cc"),
                eo=ext.get("eo"),
                prevision_campo=ext.get("prevision_campo"),
                grado_1=ext.get("grado_1", 0),
                grado_2=ext.get("grado_2", 0),
                grado_3=ext.get("grado_3", 0),
                desnudos=ext.get("desnudos", 0),
                irregular=ext.get("irregular", 0),
                )
                self.db.add(nueva_ext)

        await self.db.commit()
        # Devolver sesión con extracciones cargadas
        return await self._load_with_extracciones(sesion.id)

    async def marcar_hora(self, sesion: SesionOPU, campo: str, valor: str) -> SesionOPU:
        """Marcar hora de inicio o final para una sesión OPU"""
        setattr(sesion, campo, valor)
        await self.db.commit()
        return await self._load_with_extracciones(sesion.id)

    async def delete(self, sesion: SesionOPU) -> bool:
        """Eliminar sesión"""
        await self.db.delete(sesion)
        await self.db.commit()
        return True
