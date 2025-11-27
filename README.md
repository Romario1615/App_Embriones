# 🐄 Sistema de Gestión de Embriones Bovinos

Sistema completo de transferencia de embriones y FIV en ganado vacuno con arquitectura cliente-servidor moderna.

## 🏗️ Arquitectura

```
┌─────────────────────────────────────┐
│  FRONTEND (React + Vite)            │
│  - TailwindCSS mobile-first         │
│  - Autosave con drafts              │
│  - Responsive design                │
└─────────────────────────────────────┘
              ↕ HTTP REST API
┌─────────────────────────────────────┐
│  BACKEND (FastAPI + Python)         │
│  - Clean Architecture               │
│  - Repository Pattern               │
│  - JWT Authentication               │
└─────────────────────────────────────┘
              ↕
┌─────────────────────────────────────┐
│  BASE DE DATOS (PostgreSQL)         │
│  - Usuarios con roles               │
│  - Drafts (autosave)                │
│  - Módulos: Donadoras, OPU, etc.    │
└─────────────────────────────────────┘
```

## ⚙️ Stack Tecnológico

### Backend
- **Python 3.11+**
- **FastAPI** (API REST)
- **SQLAlchemy 2.0** (ORM async)
- **PostgreSQL 15+**
- **JWT** (Autenticación)
- **Pydantic** (Validación)

### Frontend
- **React 18**
- **Vite** (Build tool)
- **TailwindCSS** (Estilos)
- **Zustand** (Estado global)
- **React Hook Form** (Formularios)
- **Axios** (HTTP client)

## 🚀 Inicio Rápido

### 1. Clonar repositorio

```bash
cd "Aplicacion Embriones"
```

### 2. Configurar Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv
venv\Scripts\activate  # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con credenciales de PostgreSQL
```

### 3. Crear Base de Datos

```bash
# En PostgreSQL
CREATE DATABASE embriones_db;
```

### 4. Inicializar BD

```bash
python init_db.py
```

Esto crea:
- Todas las tablas
- Usuario admin (usuario: **admin**, password: **admin123**)

### 5. Ejecutar Backend

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API Docs: http://localhost:8000/docs

### 6. Configurar Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env
```

### 7. Ejecutar Frontend

```bash
npm run dev
```

Aplicación: http://localhost:5173

## 📦 Módulos del Sistema

1. **👤 Usuarios**: Sistema multiusuario con roles (admin, técnico, laboratorista, visualizador)
2. **🐄 Donadoras**: Registro de vacas donantes con fotografías
3. **🔬 OPU**: Sesiones de extracción de ovocitos (Ovum Pick-Up)
4. **🧬 Fecundación**: Proceso de fertilización in vitro (IVM + IVF)
5. **💉 Transferencia**: Registro de transferencias a receptoras
6. **✅ GFE**: Chequeos de gestación (Gestión de Fase Embrionaria)
7. **💾 Drafts**: Sistema de autosave para recuperar formularios no guardados

## 🎯 Características Principales

✅ **Sistema Multiusuario** con 4 roles diferenciados
✅ **Autosave Automático** cada 3 segundos en formularios
✅ **Diseño Responsive** mobile-first con TailwindCSS
✅ **Menú Hamburguesa** para navegación móvil
✅ **Heurísticas de Nielsen** aplicadas
✅ **Autenticación JWT** segura
✅ **Upload de Imágenes** (donadoras, microscópicas)
✅ **API REST** documentada con Swagger
✅ **Arquitectura Limpia** escalable para IA

## 📱 Heurísticas de Nielsen Aplicadas

1. ✅ **Visibilidad del estado**: Spinners, mensajes de confirmación
2. ✅ **Match mundo real**: Lenguaje zootécnico claro
3. ✅ **Control del usuario**: Cancelar, confirmar acciones
4. ✅ **Consistencia**: Colores y patrones uniformes
5. ✅ **Prevención de errores**: Validación en tiempo real
6. ✅ **Reconocimiento vs recuerdo**: Menú visible, iconos + texto
7. ✅ **Flexibilidad**: Búsquedas, filtros
8. ✅ **Diseño minimalista**: Solo información necesaria
9. ✅ **Mensajes de error claros**: Con sugerencias
10. ✅ **Ayuda contextual**: Tooltips, placeholders

## 🗂️ Estructura del Proyecto

```
Aplicacion-Embriones/
├── backend/                 # API FastAPI
│   ├── app/
│   │   ├── core/            # Config, seguridad
│   │   ├── infrastructure/  # BD, repositorios
│   │   ├── application/     # Servicios, schemas
│   │   └── presentation/    # API endpoints
│   ├── uploads/             # Archivos subidos
│   └── init_db.py           # Inicializar BD
│
├── frontend/                # App React
│   ├── src/
│   │   ├── components/      # Componentes
│   │   ├── pages/           # Páginas
│   │   ├── services/        # API services
│   │   ├── store/           # Zustand stores
│   │   └── hooks/           # Custom hooks
│   └── package.json
│
├── uploads/                 # Storage local
│   ├── donadoras/
│   └── microscopicas/
│
└── README.md                # Este archivo
```

## 🔐 Roles de Usuario

| Rol | Permisos |
|-----|----------|
| **Admin** | Crear usuarios, acceso total |
| **Técnico** | Registrar OPU, transferencias, GFE |
| **Laboratorista** | Registrar fecundaciones |
| **Visualizador** | Solo lectura |

## 🌐 Deploy

### Backend
- **Railway** / **Render** / **AWS Elastic Beanstalk**
- BD: **Supabase PostgreSQL** / **AWS RDS**

### Frontend
- **Vercel**

## 📚 Documentación Adicional

- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- API Docs: http://localhost:8000/docs

## 🧪 Testing

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

## 📝 TODO - Próximos Pasos

- [ ] Completar módulos OPU, Fecundación, Transferencia, GFE
- [ ] Agregar WebSocket para actualizaciones en tiempo real
- [ ] Implementar módulo de IA para clasificación de ovocitos
- [ ] Agregar reportes en PDF
- [ ] Gráficos y estadísticas (Chart.js)
- [ ] Tests unitarios y E2E
- [ ] Migración Alembic para BD
- [ ] Documentación de API completa

## 👥 Credenciales por Defecto

**Usuario:** `admin`
**Contraseña:** `admin123`

⚠️ **CAMBIAR EN PRODUCCIÓN**

## 📄 Licencia

Copyright © 2025 - Sistema de Gestión de Embriones Bovinos

---

**Desarrollado con ❤️ usando FastAPI, React y PostgreSQL**
