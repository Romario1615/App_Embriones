"""
Servicio para upload de imágenes a Cloudinary
"""
# Updated to use cloudinary.utils
import cloudinary
import cloudinary.uploader
import cloudinary.utils
from fastapi import UploadFile, HTTPException, status
from typing import Optional
import uuid

from app.core.config import settings


# Configurar Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True
)


ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


async def upload_image(
    file: UploadFile,
    folder: str = "donadoras",
    max_size: int = 5_242_880  # 5MB
) -> dict:
    """
    Sube una imagen a Cloudinary y retorna la información de la imagen

    Args:
        file: Archivo de imagen a subir
        folder: Carpeta en Cloudinary donde se guardará
        max_size: Tamaño máximo del archivo en bytes

    Returns:
        dict con 'url' (URL original), 'thumbnail_url' (URL optimizada) y 'public_id'
    """
    # Validar tipo de archivo
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de imagen no permitido. Usa JPG, PNG o WEBP"
        )

    # Leer contenido y validar tamaño
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La imagen excede el tamaño máximo permitido ({max_size // 1_048_576}MB)"
        )

    try:
        # Generar nombre único para el archivo
        public_id = f"{folder}/{uuid.uuid4().hex}"

        # Subir a Cloudinary
        upload_result = cloudinary.uploader.upload(
            content,
            public_id=public_id,
            folder=folder,
            resource_type="image",
            transformation=[
                {"quality": "auto", "fetch_format": "auto"}
            ]
        )

        # Generar URL optimizada para thumbnail (300x300)
        thumbnail_url, _ = cloudinary.utils.cloudinary_url(
            upload_result['public_id'],
            width=300,
            height=300,
            crop="fill",
            quality="auto",
            fetch_format="auto"
        )

        return {
            "url": upload_result['secure_url'],
            "thumbnail_url": thumbnail_url,
            "public_id": upload_result['public_id']
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al subir imagen a Cloudinary: {str(e)}"
        )


async def delete_image(public_id: str) -> bool:
    """
    Elimina una imagen de Cloudinary

    Args:
        public_id: ID público de la imagen en Cloudinary

    Returns:
        True si se eliminó correctamente
    """
    try:
        result = cloudinary.uploader.destroy(public_id)
        return result.get('result') == 'ok'
    except Exception as e:
        print(f"Error al eliminar imagen de Cloudinary: {e}")
        return False


def get_optimized_url(
    public_id: str,
    width: Optional[int] = None,
    height: Optional[int] = None,
    crop: str = "fill"
) -> str:
    """
    Genera una URL optimizada de Cloudinary

    Args:
        public_id: ID público de la imagen
        width: Ancho deseado
        height: Alto deseado
        crop: Modo de recorte (fill, scale, fit, etc.)

    Returns:
        URL optimizada de la imagen
    """
    url, _ = cloudinary.utils.cloudinary_url(
        public_id,
        width=width,
        height=height,
        crop=crop,
        quality="auto",
        fetch_format="auto"
    )
    return url
