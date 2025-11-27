# Backend - Sistema de Gestión de Embriones Bovinos

API REST construida con FastAPI, PostgreSQL y SQLAlchemy 2.0 async.

## 🚀 Inicio Rápido

### 1. Crear entorno virtual

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 2. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 3. Configurar variables de entorno

Copiar `.env.example` a `.env` y configurar:

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales de PostgreSQL y el token de UploadThing.

### 4. Base de datos PostgreSQL (Render)

Para conectarte a la instancia de Render:

```bash
PGPASSWORD=GMhv1pVZ7IePwaX0FILohW9NPbtXDUmS ^
psql -h dpg-d4juup8gjchc739qi0h0-a.oregon-postgres.render.com ^
    -U romario12 embriones
```

La URL usada en `.env` es:

```
postgresql+psycopg://romario12:GMhv1pVZ7IePwaX0FILohW9NPbtXDUmS@dpg-d4juup8gjchc739qi0h0-a.oregon-postgres.render.com/embriones
```

### 5. Inicializar base de datos

```bash
python init_db.py
```

Esto creará las tablas y un usuario admin por defecto:
- **Usuario:** admin
- **Contraseña:** admin123

### 6. Ejecutar servidor de desarrollo

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 📚 Documentación

- **API Docs (Swagger):** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## 🏗️ Estructura del Proyecto

```
backend/
├── app/
│   ├── core/                 # Configuración, seguridad
│   ├── domain/              # Entidades de dominio
│   ├── infrastructure/      # BD, repositorios
│   ├── application/         # Servicios, schemas
│   └── presentation/        # API endpoints
├── uploads/                 # Archivos subidos
├── migrations/              # Migraciones Alembic
└── tests/                   # Tests
```

## 🔐 Autenticación

La API usa JWT Bearer tokens. Para autenticarse:

1. POST `/api/v1/auth/login` con usuario y contraseña
2. Recibir token JWT
3. Incluir en header: `Authorization: Bearer {token}`

## 📦 Módulos Principales

- **Usuarios:** Gestión de usuarios y roles
- **Donadoras:** Registro de vacas donantes
- **OPU:** Sesiones de extracción de ovocitos
- **Fecundación:** Proceso de FIV
- **Transferencia:** Registro de transferencias
- **GFE:** Chequeos de gestación
- **Drafts:** Autosave de formularios
- **UploadThing:** Las fotos se suben a UploadThing y se almacena la URL en BD.

## 🛠️ Desarrollo

### Ejecutar tests

```bash
pytest
```

### Crear migración (Alembic)

```bash
alembic revision --autogenerate -m "Descripción"
alembic upgrade head
```

## 🌐 Deploy

Ver documentación de deploy en `/docs/deploy.md`
