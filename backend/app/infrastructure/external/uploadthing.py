"""
Cliente mínimo para UploadThing (uso server-to-server)

Actualmente utiliza la API REST de UploadThing para subir archivos y devolver la URL
que queda almacenada en base de datos.
"""
import base64
import json
from typing import Optional

import httpx
from fastapi import HTTPException, status, UploadFile

from app.core.config import settings


class UploadThingConfig:
    """Parámetros derivados del token de UploadThing"""

    def __init__(self, token: str):
        decoded = json.loads(base64.b64decode(token).decode())
        self.api_key: str = decoded["apiKey"]
        self.regions: list[str] = decoded.get("regions", [])
        ingest_host: str = decoded.get("ingestHost", "ingest.uploadthing.com")
        # Usar la primera región disponible
        region = self.regions[0] if self.regions else "us-west-1"
        self.ingest_url = f"https://{region}.{ingest_host}".rstrip("/")


async def upload_file(file: UploadFile) -> str:
    """
    Sube un archivo a UploadThing y retorna la URL pública (ufsUrl).

    Levanta HTTPException si hay errores.
    """
    if not settings.UPLOADTHING_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="UPLOADTHING_TOKEN no configurado",
        )

    cfg = UploadThingConfig(settings.UPLOADTHING_TOKEN)

    content = await file.read()

    # Endpoint de UTApi para subir archivos directamente
    url = f"{cfg.ingest_url}/v7/utapi/uploadFiles"

    headers = {
        "x-uploadthing-api-key": cfg.api_key,
        "x-uploadthing-be-adapter": "python-fastapi",
        "x-uploadthing-version": "7.7.4",
    }

    files = {
        "files": (
            file.filename,
            content,
            file.content_type or "application/octet-stream",
        )
    }

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(url, headers=headers, files=files)

    if resp.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"UploadThing error: {resp.status_code} {resp.text}",
        )

    data = resp.json()
    # El formato esperado incluye "data" -> lista de archivos con ufsUrl/url
    uploaded = data.get("data") or []
    if not uploaded:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="UploadThing no devolvió datos de archivo",
        )

    first: Optional[dict] = uploaded[0] if isinstance(uploaded, list) else uploaded
    url_field = first.get("ufsUrl") or first.get("url") or first.get("appUrl")
    if not url_field:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="UploadThing no devolvió URL del archivo",
        )

    return url_field
