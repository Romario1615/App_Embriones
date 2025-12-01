-- Migración: Renombrar columna estadio a estado en transferencias_realizadas
-- Fecha: 2025-02-04
-- Descripción: Corrección de nombre de columna

ALTER TABLE transferencias_realizadas
RENAME COLUMN estadio TO estado;
