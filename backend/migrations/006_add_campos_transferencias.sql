-- Migración: Agregar campos faltantes a transferencias_realizadas
-- Fecha: 2025-02-04
-- Descripción: Nuevo nombre de estado ya aplicado en 005; ahora se agregan fecha, tecnico_transferencia, cliente y finalidad

ALTER TABLE transferencias_realizadas ADD COLUMN IF NOT EXISTS fecha DATE;
ALTER TABLE transferencias_realizadas ADD COLUMN IF NOT EXISTS tecnico_transferencia VARCHAR(100);
ALTER TABLE transferencias_realizadas ADD COLUMN IF NOT EXISTS cliente VARCHAR(100);
ALTER TABLE transferencias_realizadas ADD COLUMN IF NOT EXISTS finalidad VARCHAR(20);
