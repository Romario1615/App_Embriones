# Frontend - Sistema de Gestión de Embriones Bovinos

Aplicación React 18 + Vite + TailwindCSS con diseño responsive mobile-first.

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: http://localhost:5173

## 🎨 Características

- ✅ **Diseño Responsive**: Mobile-first con TailwindCSS
- ✅ **Menú Hamburguesa**: Navegación optimizada para móviles
- ✅ **Autenticación JWT**: Login seguro con tokens
- ✅ **Autosave**: Guardado automático de formularios cada 3 segundos
- ✅ **Estado Global**: Zustand para gestión de estado
- ✅ **Validación**: React Hook Form
- ✅ **Heurísticas Nielsen**: UX optimizada

## 📱 Breakpoints (Mobile-First)

```css
/* Mobile: < 640px (default) */
/* Tablet: md: >= 768px */
/* Desktop: lg: >= 1024px */
/* Wide: xl: >= 1280px */
```

## 🏗️ Estructura

```
src/
├── components/         # Componentes reutilizables
│   ├── common/         # Botones, inputs, etc.
│   ├── layout/         # Layout, header, menú
│   └── modules/        # Por módulo (donadoras, opu, etc.)
├── pages/             # Páginas (rutas)
├── hooks/             # Custom hooks (useAutosave)
├── services/          # API services
├── store/             # Zustand stores
└── styles/            # CSS global
```

## 🔐 Credenciales de Prueba

- **Usuario:** admin
- **Contraseña:** admin123

## 🛠️ Scripts Disponibles

```bash
npm run dev      # Desarrollo
npm run build    # Build producción
npm run preview  # Preview build
```

## 📦 Deploy (Vercel)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel
```

## 🌐 Configuración de Producción

En producción, configurar las variables de entorno en Vercel:

- `VITE_API_URL`: URL de la API backend
- `VITE_WS_URL`: URL de WebSocket

## 🎯 Próximos Pasos

1. Completar módulos restantes (OPU, Fecundación, Transferencia, GFE)
2. Agregar gráficos y estadísticas
3. Implementar WebSocket para actualizaciones en tiempo real
4. Agregar tests con Vitest
