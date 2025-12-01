-- Migracion: Agregar observaciones a extraccion_donadoras
-- Fecha: 2025-02-04
-- Descripcion: Campo de texto para observaciones en cada extracción

ALTER TABLE extraccion_donadoras ADD COLUMN IF NOT EXISTS observaciones TEXT;
