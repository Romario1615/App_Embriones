/**
 * Página de gestión de donadoras con dashboard, filtros y paginación
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, RefreshCw, Edit } from 'lucide-react'
import { useDonadoraStore } from '../../store/donadoraStore'
import donadoraService from '../../services/donadoraService'
import DonadoraStats from '../../components/donadoras/DonadoraStats'
import DonadoraFilters from '../../components/donadoras/DonadoraFilters'
import Pagination from '../../components/donadoras/Pagination'

export default function DonadorasPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const {
    donadoras,
    setPaginationData,
    currentPage,
    totalPages,
    totalDonadoras,
    limit,
    filters,
    setFilters,
    setPage,
    statistics,
    setStatistics
  } = useDonadoraStore()

  useEffect(() => {
    loadStatistics()
  }, [])

  // Recargar donadoras cuando cambien filtros o página
  useEffect(() => {
    loadDonadoras()
  }, [filters, currentPage])

  const loadStatistics = async () => {
    try {
      const stats = await donadoraService.getStatistics()
      setStatistics(stats)
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    }
  }

  const loadDonadoras = async () => {
    try {
      setLoading(true)
      const params = {
        skip: (currentPage - 1) * limit,
        limit: limit,
        ...(filters.activo !== null && { activo: filters.activo }),
        ...(filters.raza && { raza: filters.raza }),
        ...(filters.tipo_ganado && { tipo_ganado: filters.tipo_ganado }),
        ...(filters.propietario_nombre && { propietario_nombre: filters.propietario_nombre }),
        ...(filters.search && { q: filters.search })
      }

      const data = await donadoraService.getAll(params)
      setPaginationData(data)
    } catch (error) {
      console.error('Error cargando donadoras:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters)
  }

  const handlePageChange = (page) => {
    setPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleExportCSV = async () => {
    try {
      await donadoraService.exportCSV(filters.activo)
      alert('CSV exportado exitosamente')
    } catch (error) {
      console.error('Error exportando CSV:', error)
      alert('Error al exportar CSV')
    }
  }

  const handleRefreshStats = async () => {
    await loadStatistics()
    await loadDonadoras()
  }

  const handleNewDonadora = () => {
    navigate('/donadoras/new')
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
          Gestión de Donadoras
        </h1>
        <div className="flex gap-2">
          <button
            onClick={handleRefreshStats}
            className="btn-secondary flex items-center space-x-2"
            title="Actualizar estadísticas"
          >
            <RefreshCw size={18} />
            <span className="hidden md:inline">Actualizar</span>
          </button>
          <button
            onClick={handleNewDonadora}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Nueva Donadora</span>
          </button>
        </div>
      </div>

      {/* Dashboard de Estadísticas */}
      <DonadoraStats statistics={statistics} />

      {/* Filtros de búsqueda */}
      <DonadoraFilters
        filters={filters}
        onApplyFilters={handleApplyFilters}
        onExportCSV={handleExportCSV}
        loading={loading}
      />

      {/* Lista de Donadoras */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">
          Donadoras Registradas
          {totalDonadoras > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-600">
              ({totalDonadoras} total)
            </span>
          )}
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="animate-spin mx-auto mb-4 text-primary" size={40} />
            <p className="text-gray-600">Cargando donadoras...</p>
          </div>
        ) : donadoras.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">
              {filters.search || filters.raza || filters.tipo_ganado || filters.propietario_nombre
                ? 'No se encontraron donadoras con los filtros aplicados.'
                : 'No hay donadoras registradas. Crea una nueva para comenzar.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Registro
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Raza
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Propietario
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {donadoras.map(donadora => (
                    <tr key={donadora.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap font-medium">{donadora.nombre}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{donadora.numero_registro}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{donadora.raza}</td>
                      <td className="px-4 py-3 whitespace-nowrap capitalize">{donadora.tipo_ganado}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{donadora.propietario_nombre}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          donadora.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {donadora.activo ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/donadoras/${donadora.id}/edit`)}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
                            title="Editar donadora"
                          >
                            <Edit size={16} />
                            <span className="text-sm">Editar</span>
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => navigate(`/donadoras/${donadora.id}`)}
                            className="flex items-center space-x-1 text-primary hover:text-primary-dark transition-colors"
                            title="Ver ficha completa"
                          >
                            <Eye size={16} />
                            <span className="text-sm">Ver</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalDonadoras}
              limit={limit}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  )
}
