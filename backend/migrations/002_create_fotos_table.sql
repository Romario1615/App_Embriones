-- Migración: Crear tabla de fotos
-- Fecha: 2025-01-27
-- Descripción: Tabla para almacenar múltiples fotos por entidad (donadoras, transferencias, etc.)

CREATE TABLE IF NOT EXISTS fotos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entidad_tipo VARCHAR(50) NOT NULL,
    entidad_id INTEGER NOT NULL,
    orden INTEGER DEFAULT 0 NOT NULL,
    url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    public_id VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_creacion_id INTEGER REFERENCES usuarios(id)
);
