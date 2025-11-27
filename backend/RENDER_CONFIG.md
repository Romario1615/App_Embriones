# Configuración de Variables de Entorno en Render

Este documento describe todas las variables de entorno que debes configurar en Render para el backend de la aplicación de Embriones.

## Acceder a Variables de Entorno en Render

1. Ve a tu servicio en Render Dashboard
2. Click en **Environment** en el menú lateral
3. Agrega cada variable con el botón **Add Environment Variable**

---

## Variables Requeridas

### 📦 Base de Datos

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `DATABASE_URL` | *Auto-generado* | Render genera esto automáticamente cuando conectas PostgreSQL. **NO modificar manualmente**. |

**Nota:** Si creaste una base de datos PostgreSQL en Render, esta variable se configura automáticamente.

---

### 🔐 Seguridad

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `SECRET_KEY` | `[GENERAR CLAVE ÚNICA]` | Clave secreta para JWT. **IMPORTANTE:** Genera una clave segura única para producción |
| `ALGORITHM` | `HS256` | Algoritmo para JWT |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Tiempo de expiración de tokens en minutos |

**Generar SECRET_KEY seguro:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

O usa este valor generado:
```
TU_SECRET_KEY_SUPER_SEGURA_Y_LARGA_DE_AL_MENOS_64_CARACTERES_AQUI
```

---

### 🌐 CORS

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `FRONTEND_URL` | `https://tu-frontend.vercel.app` | URL de tu frontend en producción (sin barra final) |

**Ejemplos:**
- Frontend en Vercel: `https://embriones-app.vercel.app`
- Frontend en Netlify: `https://embriones-app.netlify.app`

---

### ☁️ Cloudinary (Imágenes)

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `CLOUDINARY_CLOUD_NAME` | `dwnmf6niq` | Nombre de tu cloud en Cloudinary |
| `CLOUDINARY_API_KEY` | `165586669561659` | API Key de Cloudinary |
| `CLOUDINARY_API_SECRET` | `w3K08BOp-z98EIdUbfCFwvMRbds` | API Secret de Cloudinary |

**IMPORTANTE:** Estas son tus credenciales de Cloudinary. Si prefieres usar otra cuenta, crea una nueva en [cloudinary.com](https://cloudinary.com) y reemplaza los valores.

---

### 📁 Uploads (Opcional - Legacy)

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `UPLOAD_DIR` | `uploads` | Directorio para uploads locales (opcional, ahora usa Cloudinary) |
| `MAX_FILE_SIZE` | `5242880` | Tamaño máximo de archivo (5MB) |

**Nota:** Estas variables son legacy. La aplicación ahora usa Cloudinary para imágenes.

---

### 🌍 Ambiente

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `ENVIRONMENT` | `production` | Ambiente de ejecución |

---

## Resumen: Variables que DEBES configurar

Copia y pega estos valores en Render:

```bash
# Seguridad (CAMBIAR SECRET_KEY)
SECRET_KEY=TU_SECRET_KEY_GENERADA_AQUI
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS (CAMBIAR con tu URL de frontend)
FRONTEND_URL=https://tu-frontend.vercel.app

# Cloudinary (Usar estas o tus propias credenciales)
CLOUDINARY_CLOUD_NAME=dwnmf6niq
CLOUDINARY_API_KEY=165586669561659
CLOUDINARY_API_SECRET=w3K08BOp-z98EIdUbfCFwvMRbds

# Ambiente
ENVIRONMENT=production

# Uploads (Opcional)
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

---

## Checklist de Configuración

- [ ] `DATABASE_URL` está auto-configurada (verificar en Environment tab)
- [ ] `SECRET_KEY` generada con valor único y seguro
- [ ] `FRONTEND_URL` configurada con URL de producción del frontend
- [ ] Credenciales de Cloudinary configuradas
- [ ] `ENVIRONMENT=production`
- [ ] Todas las variables guardadas en Render
- [ ] Servicio re-desplegado después de configurar variables

---

## Notas Importantes

1. **SECRET_KEY:** Nunca uses el valor por defecto. Genera uno nuevo.
2. **FRONTEND_URL:** Debe ser exactamente la URL de tu frontend (sin `/` al final)
3. **DATABASE_URL:** Render lo genera automáticamente, no lo toques
4. **Cloudinary:** Las credenciales son de tu cuenta, guárdalas seguras
5. **Re-deploy:** Después de cambiar variables, Render re-desplegará automáticamente

---

## Migración de Base de Datos

Después de configurar las variables, ejecuta la migración para agregar campos de Cloudinary:

```bash
# En tu máquina local (conectado a la BD de Render)
python run_migration.py 001_add_cloudinary_fields.sql
```

O ejecuta manualmente en la consola de PostgreSQL:

```sql
ALTER TABLE donadoras ADD COLUMN foto_thumbnail VARCHAR(500);
ALTER TABLE donadoras ADD COLUMN foto_public_id VARCHAR(200);
```

---

## Verificar Configuración

Después de configurar todo, verifica que la API funcione:

1. Abre: `https://tu-backend.onrender.com/docs`
2. Deberías ver la documentación de Swagger
3. Prueba el endpoint `/health` o similar
4. Intenta hacer login con las credenciales de admin

---

## Problemas Comunes

### Error de CORS
- Verifica que `FRONTEND_URL` esté correctamente configurada
- No debe tener `/` al final

### Error de Cloudinary
- Verifica las tres credenciales de Cloudinary
- Asegúrate de copiarlas exactamente

### Error de JWT
- Genera un nuevo `SECRET_KEY` único
- Reinicia el servicio después de cambiarla

---

## Contacto

Si tienes problemas con la configuración, revisa:
- Logs en Render Dashboard
- README.md del backend
- Documentación de FastAPI
