"""
Script para ejecutar migraciones SQL
"""
import sqlite3
import sys
from pathlib import Path

def run_migration(migration_file: str):
    """Ejecuta un archivo de migración SQL"""
    db_path = Path(__file__).parent / "embriones.db"
    migration_path = Path(__file__).parent / "migrations" / migration_file

    if not migration_path.exists():
        print(f"[ERROR] Archivo de migracion no encontrado: {migration_path}")
        sys.exit(1)

    print(f"Base de datos: {db_path}")
    print(f"Migracion: {migration_path}")

    # Leer SQL
    with open(migration_path, 'r', encoding='utf-8') as f:
        sql = f.read()

    # Conectar y ejecutar
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Ejecutar cada sentencia SQL
        for statement in sql.split(';'):
            statement = statement.strip()
            if statement and not statement.startswith('--'):
                print(f"Ejecutando: {statement[:50]}...")
                cursor.execute(statement)

        conn.commit()
        conn.close()

        print("[OK] Migracion aplicada exitosamente")
    except Exception as e:
        print(f"[ERROR] Error al aplicar migracion: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python run_migration.py <archivo_migracion>")
        print("Ejemplo: python run_migration.py 001_add_cloudinary_fields.sql")
        sys.exit(1)

    run_migration(sys.argv[1])
