-- Migracion: Agregar campos de foto a extraccion_donadoras
-- Fecha: 2025-02-03
-- Descripcion: Campos para almacenar fotos en registros de extraccion

ALTER TABLE extraccion_donadoras ADD COLUMN IF NOT EXISTS foto_ruta VARCHAR(500);
ALTER TABLE extraccion_donadoras ADD COLUMN IF NOT EXISTS foto_thumbnail VARCHAR(500);
ALTER TABLE extraccion_donadoras ADD COLUMN IF NOT EXISTS foto_public_id VARCHAR(200);
