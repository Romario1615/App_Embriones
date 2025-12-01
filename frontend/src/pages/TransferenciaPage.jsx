import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Eye, Plus, Trash2 } from 'lucide-react'
import sesionTransferenciaService from '../services/sesionTransferenciaService'

export default function TransferenciaPage() {
  const navigate = useNavigate()
  const [sesiones, setSesiones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSesiones()
  }, [])

  const loadSesiones = async () => {
    setLoading(true)
    try {
      const data = await sesionTransferenciaService.getAll()
      setSesiones(data || [])
    } catch (error) {
      console.error('Error cargando sesiones de transferencia', error)
      alert('No se pudieron cargar las sesiones')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSesion = async (sesion) => {
    if (!window.confirm('¿Eliminar la sesión y sus transferencias?')) return
    try {
      await sesionTransferenciaService.remove(sesion.id)
      await loadSesiones()
    } catch (error) {
      console.error(error)
      alert('No se pudo eliminar la sesión')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Módulo Transferencias</h1>
          <p className="text-gray-600">Gestiona las sesiones registradas</p>
        </div>
        <button
          onClick={() => navigate('/transferencia/nueva')}
          className="btn-primary flex items-center space-x-2 self-start md:self-center"
        >
          <Plus size={18} />
          <span>Nueva sesión</span>
        </button>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Sesiones de Transferencia</h2>
          <button onClick={loadSesiones} className="btn-secondary">Refrescar</button>
        </div>

        {loading ? (
          <p className="text-gray-600 text-center py-6">Cargando...</p>
        ) : sesiones.length === 0 ? (
          <p className="text-gray-600 text-center py-6">No hay sesiones registradas</p>
        ) : (
          <div className="space-y-4">
            {sesiones.map((sesion) => {
              const lista = sesion.transferencias_realizadas || []
              const totalTransferencias = lista.length
              const conDonadora = lista.filter(t => t.donadora_id).length
              const estados = new Set(lista.filter(t => t.estado).map(t => t.estado)).size
              const receptoras = new Set(lista.filter(t => t.receptora).map(t => t.receptora)).size

              return (
                <div
                  key={sesion.id}
                  className="border-2 border-teal-200 rounded-xl p-5 bg-gradient-to-br from-white to-teal-50/40 hover:shadow-lg transition-all duration-300 hover:border-teal-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="bg-gradient-to-br from-teal-600 to-cyan-600 p-3 rounded-xl shadow-md">
                        <Calendar className="text-white" size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-gray-900">
                            {sesion.fecha ? new Date(sesion.fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Sin fecha'}
                          </h3>
                          <span className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded-full font-semibold">
                            ID: {sesion.id}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                          {sesion.tecnico_transferencia && (
                            <span className="font-medium flex items-center gap-1">
                              <span className="inline-block w-2 h-2 bg-teal-500 rounded-full" />
                              {sesion.tecnico_transferencia}
                            </span>
                          )}
                          {sesion.cliente && <span className="font-medium">· {sesion.cliente}</span>}
                          {sesion.hacienda && <span className="font-medium">· {sesion.hacienda}</span>}
                          {sesion.finalidad && (
                            <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs font-semibold capitalize">
                              {sesion.finalidad}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => navigate(`/transferencia/${sesion.fecha}`)}
                        className="btn-primary flex items-center gap-1.5 px-3 py-2 text-sm"
                      >
                        <Eye size={16} />
                        <span>Ver detalles</span>
                      </button>
                      <button
                        onClick={() => handleDeleteSesion(sesion)}
                        className="px-3 py-2 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg border border-red-200 transition-colors flex items-center gap-1.5 font-medium"
                      >
                        <Trash2 size={16} />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white/70 rounded-lg p-3 border border-teal-100">
                      <p className="text-xs text-teal-700 font-semibold uppercase mb-1">Transferencias</p>
                      <p className="text-2xl font-bold text-teal-900">{totalTransferencias}</p>
                    </div>
                    <div className="bg-white/70 rounded-lg p-3 border border-green-100">
                      <p className="text-xs text-green-700 font-semibold uppercase mb-1">Con donadora</p>
                      <p className="text-2xl font-bold text-green-900">{conDonadora}</p>
                    </div>
                    <div className="bg-white/70 rounded-lg p-3 border border-blue-100">
                      <p className="text-xs text-blue-700 font-semibold uppercase mb-1">Estados</p>
                      <p className="text-2xl font-bold text-blue-900">{estados}</p>
                    </div>
                    <div className="bg-white/70 rounded-lg p-3 border border-purple-100">
                      <p className="text-xs text-purple-700 font-semibold uppercase mb-1">Receptoras</p>
                      <p className="text-2xl font-bold text-purple-900">{receptoras}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
