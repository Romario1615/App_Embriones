import datetime
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.infrastructure.database.connection import Base
from app.infrastructure.database.models import SesionOPU, Donadora
from app.infrastructure.repositories.opu_repository import OPURepository


@pytest.fixture
async def db_session():
    """
    Crea una BD SQLite en memoria para cada test y entrega una AsyncSession.
    """
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        yield session

    await engine.dispose()


def _extr_base(numero):
    """Datos base para una extracción con secuencial dado."""
    return {
        "numero_secuencial": numero,
        "hora_inicio": "08:00",
        "hora_fin": "09:00",
        "toro_a": "Toro A",
        "toro_b": "Toro B",
        "raza_toro": "Brahman",
        "ct": "ct",
        "cc": "cc",
        "eo": "eo",
        "prevision_campo": 1,
        "grado_1": 1,
        "grado_2": 2,
        "grado_3": 3,
        "desnudos": 0,
        "irregular": 0,
    }


@pytest.mark.asyncio
async def test_update_syncs_extracciones_without_recreate(db_session):
    # Arrange: donadora y sesión inicial con una extracción
    donadora = Donadora(
        nombre="Dona",
        numero_registro="R-1",
        raza="Brahman",
        tipo_ganado="carne",
        propietario_nombre="Owner",
        activo=True,
    )
    db_session.add(donadora)
    await db_session.commit()
    await db_session.refresh(donadora)

    repo = OPURepository(db_session)
    sesion = SesionOPU(
        fecha=datetime.date.today(),
        tecnico_opu="Tec OPU",
        tecnico_busqueda="Tec Bus",
        cliente="Cliente 1",
        finalidad="fresco",
    )

    created = await repo.create_with_extracciones(
        sesion,
        [
            {
                **_extr_base(1),
                "donadora_id": donadora.id,
            }
        ],
    )
    assert len(created.extracciones_donadoras) == 1
    original_id = created.extracciones_donadoras[0].id

    # Act: actualizar sesión + agregar nueva extracción y modificar cliente
    updated = await repo.update(
        created,
        {"cliente": "Cliente 2"},
        [
            {
                "id": original_id,
                **_extr_base(1),
                "donadora_id": donadora.id,
            },
            {
                **_extr_base(2),
                "donadora_id": donadora.id,
            },
        ],
    )

    # Assert: la extracción original conserva su id y se creó una nueva
    assert updated.cliente == "Cliente 2"
    assert len(updated.extracciones_donadoras) == 2
    ext1 = next(e for e in updated.extracciones_donadoras if e.numero_secuencial == 1)
    ext2 = next(e for e in updated.extracciones_donadoras if e.numero_secuencial == 2)
    assert ext1.id == original_id
    assert ext2.id != original_id

    # Act 2: eliminar la extracción 2 y mantener la 1
    updated2 = await repo.update(
        updated,
        {"cliente": "Cliente 3"},
        [
            {
                "id": original_id,
                **_extr_base(1),
                "donadora_id": donadora.id,
            }
        ],
    )

    # Assert: queda solo una extracción y con el id original
    assert updated2.cliente == "Cliente 3"
    assert len(updated2.extracciones_donadoras) == 1
    assert updated2.extracciones_donadoras[0].id == original_id
