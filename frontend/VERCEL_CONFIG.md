# Configuración de Variables de Entorno en Vercel

## Variables de Entorno Requeridas

Para que el frontend en Vercel funcione correctamente, necesitas configurar las siguientes variables de entorno:

### En el Dashboard de Vercel:

1. Ve a tu proyecto en Vercel
2. Ve a **Settings** → **Environment Variables**
3. Agrega las siguientes variables:

| Variable | Valor | Ambiente |
|----------|-------|----------|
| `VITE_API_URL` | `https://app-embriones.onrender.com/api/v1` | Production, Preview |
| `VITE_WS_URL` | `wss://app-embriones.onrender.com` | Production, Preview |

### Pasos Detallados:

1. **Ir a Configuración:**
   - Dashboard de Vercel → Tu Proyecto → Settings

2. **Agregar Variable de Entorno:**
   - Environment Variables → Add New
   - Name: `VITE_API_URL`
   - Value: `https://app-embriones.onrender.com/api/v1`
   - Environments: Selecciona **Production** y **Preview**
   - Click en **Save**

3. **Agregar Segunda Variable:**
   - Add New
   - Name: `VITE_WS_URL`
   - Value: `wss://app-embriones.onrender.com`
   - Environments: Selecciona **Production** y **Preview**
   - Click en **Save**

4. **Redesplegar:**
   - Ve a **Deployments**
   - Click en los tres puntos (...) del último deployment
   - Selecciona **Redeploy**
   - Esto aplicará las nuevas variables de entorno

## Verificar Configuración

Después del redespliegue, verifica que:
- ✅ El frontend se conecta al backend de Render
- ✅ No hay errores de CORS
- ✅ El login funciona correctamente
- ✅ Las peticiones a `/api/v1/donadoras/` funcionan

## Archivos de Entorno Locales

### `.env` (Desarrollo Local)
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_WS_URL=http://localhost:8000
```

### `.env.production` (Build de Producción)
```env
VITE_API_URL=https://app-embriones.onrender.com/api/v1
VITE_WS_URL=wss://app-embriones.onrender.com
```

## Problemas Comunes

### Error: "Network Error" o CORS
**Causa:** Variables de entorno no configuradas en Vercel
**Solución:** Configurar las variables y redesplegar

### Error: "Not authenticated"
**Causa:** El token JWT no está siendo enviado o es inválido
**Solución:** Hacer login nuevamente

### Error: 404 Not Found en /api/v1
**Causa:** URL del backend incorrecta
**Solución:** Verificar que `VITE_API_URL` apunta a Render correctamente

---

**Nota:** Después de cambiar variables de entorno en Vercel, siempre debes redesplegar para que los cambios surtan efecto.
