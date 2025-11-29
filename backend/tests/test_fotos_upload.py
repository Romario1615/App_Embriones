import io
import pytest
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.infrastructure.database.connection import Base
from app.presentation.api.v1.endpoints import fotos
from app.core.dependencies import get_db, get_current_user


@pytest.fixture
async def test_app(monkeypatch):
    """
    App FastAPI mínima con BD en memoria y dependencias sobreescritas
    para probar upload de fotos sin tocar servicios externos.
    """
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async def override_get_db():
        async with SessionLocal() as session:
            yield session

    class DummyUser:
        id = 1

    def override_get_current_user():
        return DummyUser()

    async def fake_upload_image(file, folder="extracciones", max_size=5_242_880):
        # Consumir el file para simular lectura (luego se descarta)
        await file.read()
        return {
            "url": "http://cloudinary.test/image.jpg",
            "thumbnail_url": "http://cloudinary.test/thumb.jpg",
            "public_id": "fake_public_id",
        }

    async def fake_delete_image(public_id: str) -> bool:
        return True

    # Parchear servicios de Cloudinary en el endpoint de fotos
    monkeypatch.setattr(fotos, "upload_image", fake_upload_image)
    monkeypatch.setattr(fotos, "delete_image", fake_delete_image)

    app = FastAPI()
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.include_router(fotos.router, prefix="/api/v1/fotos")

    try:
        yield app
    finally:
        await engine.dispose()


@pytest.mark.asyncio
async def test_upload_foto_extraccion(test_app):
    file_content = b"\x89PNG\r\n\x1a\n"  # header mínimo PNG
    files = {"archivo": ("photo.png", io.BytesIO(file_content), "image/png")}
    data = {"entidad_tipo": "extraccion", "entidad_id": "1", "orden": "0"}

    async with AsyncClient(app=test_app, base_url="http://test") as client:
        resp = await client.post("/api/v1/fotos/", files=files, data=data)

    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["entidad_tipo"] == "extraccion"
    assert body["entidad_id"] == 1
    assert body["orden"] == 0
    assert body["url"].startswith("http://cloudinary.test/")
    assert body["public_id"] == "fake_public_id"
