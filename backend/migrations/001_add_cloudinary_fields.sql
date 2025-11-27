-- Migración: Agregar campos de Cloudinary a la tabla donadoras
-- Fecha: 2025-01-27
-- Descripción: Agrega foto_thumbnail y foto_public_id para integración con Cloudinary

-- Agregar columna foto_thumbnail
ALTER TABLE donadoras ADD COLUMN foto_thumbnail VARCHAR(500);

-- Agregar columna foto_public_id
ALTER TABLE donadoras ADD COLUMN foto_public_id VARCHAR(200);

-- Nota: Las imágenes existentes en foto_ruta seguirán funcionando.
-- Las nuevas imágenes se subirán a Cloudinary y tendrán todos los campos populados.
