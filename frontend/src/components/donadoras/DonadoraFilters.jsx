/**
 * Componente de filtros avanzados para donadoras
 */
import { Search, X, Download, Filter } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function DonadoraFilters({ filters, onFilterChange, onApplyFilters, onExportCSV, loading }) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [tempFilters, setTempFilters] = useState(filters)

  // Sincronizar filtros temporales cuando cambien los filtros aplicados
  useEffect(() => {
    setTempFilters(filters)
  }, [filters])

  const handleTempFilterChange = (newFilters) => {
    setTempFilters({ ...tempFilters, ...newFilters })
  }

  const handleApplyFilters = () => {
    onApplyFilters(tempFilters)
  }

  const handleClearFilters = () => {
    const defaultFilters = {
      raza: '',
      tipo_ganado: '',
      propietario_nombre: '',
      activo: true,
      search: ''
    }
    setTempFilters(defaultFilters)
    onApplyFilters(defaultFilters)
  }

  const hasActiveFilters = tempFilters.raza || tempFilters.tipo_ganado || tempFilters.propietario_nombre || tempFilters.search
  const hasUnappliedChanges = JSON.stringify(tempFilters) !== JSON.stringify(filters)

  return (
    <div className="card mb-6">
      <div className="space-y-4">
        {/* Barra de búsqueda principal */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre o número de registro..."
              value={tempFilters.search}
              onChange={(e) => handleTempFilterChange({ search: e.target.value })}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleApplyFilters()
                }
              }}
              className="input-field pl-10"
            />
            {tempFilters.search && (
              <button
                onClick={() => handleTempFilterChange({ search: '' })}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`btn-secondary ${hasActiveFilters ? 'ring-2 ring-primary' : ''}`}
            >
              {showAdvanced ? 'Ocultar Filtros' : 'Filtros Avanzados'}
              {hasActiveFilters && (
                <span className="ml-2 px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                  {[tempFilters.raza, tempFilters.tipo_ganado, tempFilters.propietario_nombre, tempFilters.search].filter(Boolean).length}
                </span>
              )}
            </button>

            <button
              onClick={onExportCSV}
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
              title="Exportar a CSV"
            >
              <Download size={18} />
              <span className="hidden md:inline">Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Filtros avanzados (colapsables) */}
        {showAdvanced && (
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Filtro por Raza */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Raza
                </label>
                <select
                  value={tempFilters.raza}
                  onChange={(e) => handleTempFilterChange({ raza: e.target.value })}
                  className="input-field"
                >
                  <option value="">Todas las razas</option>
                  <option value="Holstein">Holstein</option>
                  <option value="Angus">Angus</option>
                  <option value="Brahman">Brahman</option>
                  <option value="Jersey">Jersey</option>
                </select>
              </div>

              {/* Filtro por Tipo de Ganado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Ganado
                </label>
                <select
                  value={tempFilters.tipo_ganado}
                  onChange={(e) => handleTempFilterChange({ tipo_ganado: e.target.value })}
                  className="input-field"
                >
                  <option value="">Todos los tipos</option>
                  <option value="carne">Carne</option>
                  <option value="leche">Leche</option>
                </select>
              </div>

              {/* Filtro por Propietario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Propietario
                </label>
                <input
                  type="text"
                  placeholder="Nombre del propietario"
                  value={tempFilters.propietario_nombre}
                  onChange={(e) => handleTempFilterChange({ propietario_nombre: e.target.value })}
                  className="input-field"
                />
              </div>

              {/* Filtro por Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={tempFilters.activo === null ? 'all' : tempFilters.activo.toString()}
                  onChange={(e) => {
                    const value = e.target.value
                    handleTempFilterChange({
                      activo: value === 'all' ? null : value === 'true'
                    })
                  }}
                  className="input-field"
                >
                  <option value="true">Solo Activas</option>
                  <option value="false">Solo Inactivas</option>
                  <option value="all">Todas</option>
                </select>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="mt-4 flex justify-end gap-2">
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="btn-secondary flex items-center space-x-1"
                >
                  <X size={16} />
                  <span>Limpiar Filtros</span>
                </button>
              )}
              <button
                onClick={handleApplyFilters}
                disabled={!hasUnappliedChanges && !hasActiveFilters}
                className={`btn-primary flex items-center space-x-1 ${
                  hasUnappliedChanges ? 'ring-2 ring-green-500' : ''
                }`}
              >
                <Filter size={16} />
                <span>Aplicar Filtros</span>
                {hasUnappliedChanges && (
                  <span className="ml-1 w-2 h-2 bg-green-400 rounded-full"></span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
