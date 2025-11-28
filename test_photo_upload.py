"""
Script para probar la funcionalidad de subida de fotos
"""
import requests
from io import BytesIO
from PIL import Image

# Configuración
API_BASE_URL = "http://localhost:8000/api/v1"

def create_test_image():
    """Crear una imagen de prueba"""
    img = Image.new('RGB', (400, 300), color='red')
    img_bytes = BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    return img_bytes

def login():
    """Login para obtener token"""
    print("1. Intentando hacer login...")
    response = requests.post(
        f"{API_BASE_URL}/auth/login",
        data={
            "username": "admin",
            "password": "admin123"
        }
    )

    if response.status_code == 200:
        token = response.json()["access_token"]
        print(f"   [OK] Login exitoso")
        return token
    else:
        print(f"   [ERROR] Error en login: {response.status_code}")
        print(f"   Respuesta: {response.text}")
        return None

def upload_photo(token):
    """Subir una foto de prueba"""
    print("\n2. Creando imagen de prueba...")
    img_bytes = create_test_image()
    print(f"   [OK] Imagen creada (400x300 px, formato JPEG)")

    print("\n3. Subiendo foto a través del API...")
    files = {
        'archivo': ('test_photo.jpg', img_bytes, 'image/jpeg')
    }
    data = {
        'entidad_tipo': 'donadora',
        'entidad_id': 1,
        'orden': 0,
        'descripcion': 'Foto de prueba'
    }
    headers = {
        'Authorization': f'Bearer {token}'
    }

    response = requests.post(
        f"{API_BASE_URL}/fotos/",
        files=files,
        data=data,
        headers=headers
    )

    if response.status_code == 201:
        foto_data = response.json()
        print(f"   [OK] Foto subida exitosamente!")
        print(f"   - ID: {foto_data.get('id')}")
        print(f"   - URL: {foto_data.get('url')}")
        print(f"   - Thumbnail URL: {foto_data.get('thumbnail_url')}")
        print(f"   - Public ID: {foto_data.get('public_id')}")
        return foto_data
    else:
        print(f"   [ERROR] Error al subir foto: {response.status_code}")
        print(f"   Respuesta: {response.text}")
        return None

def get_photos(token):
    """Obtener las fotos de una entidad"""
    print("\n4. Obteniendo fotos de la donadora...")
    headers = {
        'Authorization': f'Bearer {token}'
    }

    response = requests.get(
        f"{API_BASE_URL}/fotos/donadora/1",
        headers=headers
    )

    if response.status_code == 200:
        fotos_data = response.json()
        print(f"   [OK] Fotos obtenidas exitosamente!")
        print(f"   - Total de fotos: {fotos_data.get('total')}")
        for i, foto in enumerate(fotos_data.get('fotos', []), 1):
            print(f"   - Foto {i}: ID={foto.get('id')}, Orden={foto.get('orden')}")
        return fotos_data
    else:
        print(f"   [ERROR] Error al obtener fotos: {response.status_code}")
        print(f"   Respuesta: {response.text}")
        return None

def main():
    print("=" * 60)
    print("TEST DE FUNCIONALIDAD DE SUBIDA DE FOTOS")
    print("=" * 60)

    # Login
    token = login()
    if not token:
        print("\n[ERROR] No se pudo obtener token de autenticacion")
        return

    # Upload photo
    foto = upload_photo(token)
    if not foto:
        print("\n[ERROR] No se pudo subir la foto")
        return

    # Get photos
    fotos = get_photos(token)

    print("\n" + "=" * 60)
    if foto and fotos:
        print("[OK] TODAS LAS PRUEBAS PASARON EXITOSAMENTE")
    else:
        print("[WARNING] ALGUNAS PRUEBAS FALLARON")
    print("=" * 60)

if __name__ == "__main__":
    main()
