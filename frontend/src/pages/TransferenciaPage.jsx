import { useEffect, useState, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Plus, Save, Edit3, Trash2, Eye, Calendar, Target, X, Search } from 'lucide-react'
import { useTransferenciaStore } from '../store/transferenciaStore'
import transferenciaService from '../services/transferenciaService'
import donadoraService from '../services/donadoraService'

export default function TransferenciaPage() {
  const navigate = useNavigate()
  const { transferencias, setTransferencias, addTransferencia, updateTransferencia, removeTransferencia } = useTransferenciaStore()
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  const [selectedDonadora, setSelectedDonadora] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [donadorasMap, setDonadorasMap] = useState({})
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [donadorasList, setDonadorasList] = useState([])
  const [donadoraSearch, setDonadoraSearch] = useState('')
  const [showDonadoraModal, setShowDonadoraModal] = useState(false)
  const isSubmittingRef = useRef(false)

  useEffect(() => {
    loadData()
    preloadDonadoras()
    loadDonadoras()
  }, [])

  const preloadDonadoras = async () => {
    try {
      const response = await donadoraService.getAll({ limit: 1000 })
      const donadoras = response.donadoras || []
      const map = donadoras.reduce((acc, d) => ({ ...acc, [d.id]: d }), {})
      setDonadorasMap(map)
    } catch (error) {
      console.error('Error cargando donadoras', error)
    }
  }

  const loadDonadoras = async () => {
    try {
      const response = await donadoraService.getAll({ limit: 1000, activo: true })
      const donadoras = response.donadoras || []
      setDonadorasList(donadoras)
    } catch (error) {
      console.error('Error cargando donadoras:', error)
    }
  }

  const filteredDonadoras = useMemo(() => {
    const term = donadoraSearch.trim().toLowerCase()
    if (!term) return donadorasList
    return donadorasList.filter(d =>
      `${d.nombre} ${d.numero_registro}`.toLowerCase().includes(term)
    )
  }, [donadoraSearch, donadorasList])

  const handleSelectDonadora = (donadora) => {
    setSelectedDonadora(donadora)
    setShowDonadoraModal(false)
    setDonadoraSearch('')
  }

  const loadData = async () => {
    try {
      const data = await transferenciaService.getAll()
      setTransferencias(data)
    } catch (error) {
      console.error('Error cargando transferencias', error)
    }
  }

  const onSubmit = async (data) => {
    // Prevenir envíos concurrentes (doble clic)
    if (isSubmittingRef.current) {
      console.warn('Ya hay un envío en progreso, ignorando...')
      return
    }

    isSubmittingRef.current = true
    setLoading(true)
    const payload = {
      ...data,
      numero_secuencial: parseInt(data.numero_secuencial, 10),
      donadora_id: selectedDonadora?.id || null
    }

    try {
      if (editingId) {
        const updated = await transferenciaService.update(editingId, payload)
        updateTransferencia(editingId, updated)
        alert('Transferencia actualizada')
      } else {
        const created = await transferenciaService.create(payload)
        addTransferencia(created)
        alert('Transferencia registrada')
      }
      reset()
      setSelectedDonadora(null)
      setEditingId(null)
      setShowForm(false)
    } catch (error) {
      console.error(error)
      alert('Error al guardar: ' + (error.response?.data?.detail || error.message))
    } finally {
      setLoading(false)
      isSubmittingRef.current = false
    }
  }

  // Agrupar transferencias por fecha de creación (sesiones)
  const sesiones = useMemo(() => {
    const grupos = {}
    transferencias.forEach(t => {
      const fecha = new Date(t.fecha_creacion).toISOString().split('T')[0]
      if (!grupos[fecha]) {
        grupos[fecha] = {
          fecha,
          transferencias: []
        }
      }
      const donadora = donadorasMap[t.donadora_id]
      grupos[fecha].transferencias.push({ ...t, donadora })
    })
    return Object.values(grupos).sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  }, [transferencias, donadorasMap])

  const handleEdit = async (transferencia) => {
    setEditingId(transferencia.id)
    reset({
      numero_secuencial: transferencia.numero_secuencial,
      toro: transferencia.toro || '',
      raza_toro: transferencia.raza_toro || '',
      estadio: transferencia.estadio || '',
      receptora: transferencia.receptora || '',
      ciclado_izquierdo: transferencia.ciclado_izquierdo || '',
      ciclado_derecho: transferencia.ciclado_derecho || '',
      observaciones: transferencia.observaciones || ''
    })

    if (transferencia.donadora_id) {
      if (donadorasMap[transferencia.donadora_id]) {
        setSelectedDonadora(donadorasMap[transferencia.donadora_id])
      } else {
        const data = await donadoraService.getById(transferencia.donadora_id)
        setSelectedDonadora(data)
      }
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar transferencia?')) return
    try {
      await transferenciaService.delete(id)
      removeTransferencia(id)
    } catch (error) {
      console.error(error)
      alert('No se pudo eliminar')
    }
  }

  const handleEditSesion = async (sesion) => {
    // Abrir formulario para permitir agregar/editar transferencias de esta sesión
    setShowForm(true)
    // Limpiar formulario
    reset({
      numero_secuencial: 1,
      toro: '',
      raza_toro: '',
      estadio: '',
      receptora: '',
      ciclado_izquierdo: '',
      ciclado_derecho: '',
      observaciones: ''
    })
    setSelectedDonadora(null)
    setEditingId(null)
  }

  const handleDeleteSesion = async (sesion) => {
    const mensaje = `¿Eliminar toda la sesión del ${new Date(sesion.fecha).toLocaleDateString()} con ${sesion.transferencias.length} transferencias?`
    if (!window.confirm(mensaje)) return

    try {
      // Eliminar todas las transferencias de la sesión
      await Promise.all(sesion.transferencias.map(t => transferenciaService.delete(t.id)))

      // Actualizar el store
      sesion.transferencias.forEach(t => removeTransferencia(t.id))

      alert('Sesión eliminada correctamente')
    } catch (error) {
      console.error(error)
      alert('Error al eliminar la sesión')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Módulo de Transferencia de Embriones</h1>
          <p className="text-gray-600">Gestiona sesiones de transferencia</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm)
            if (!showForm) {
              reset()
              setSelectedDonadora(null)
              setEditingId(null)
            }
          }}
          className="btn-primary flex items-center space-x-2 self-start md:self-center"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          <span>{showForm ? 'Cerrar formulario' : 'Nueva transferencia'}</span>
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Editar transferencia' : 'Registrar transferencia'}
          </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Donadora</label>
              <button
                type="button"
                onClick={() => setShowDonadoraModal(true)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {selectedDonadora ? (
                  <div>
                    <p className="font-medium text-gray-900">{selectedDonadora.nombre}</p>
                    <p className="text-sm text-gray-600">Registro: {selectedDonadora.numero_registro}</p>
                  </div>
                ) : (
                  <span className="text-gray-500">Seleccionar donadora...</span>
                )}
              </button>
              {selectedDonadora && (
                <button
                  type="button"
                  onClick={() => setSelectedDonadora(null)}
                  className="text-sm text-red-600 hover:text-red-800 mt-1"
                >
                  Limpiar selección
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N° secuencial *</label>
              <input
                type="number"
                className="input-field"
                {...register('numero_secuencial', { required: 'Campo requerido', min: 1 })}
              />
              {errors.numero_secuencial && <p className="text-red-500 text-sm">{errors.numero_secuencial.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Toro</label>
              <input className="input-field" {...register('toro')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Raza del toro</label>
              <input className="input-field" {...register('raza_toro')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estadio</label>
              <input className="input-field" {...register('estadio')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Receptora</label>
              <input className="input-field" {...register('receptora')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciclado izquierdo</label>
              <input className="input-field" {...register('ciclado_izquierdo')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciclado derecho</label>
              <input className="input-field" {...register('ciclado_derecho')} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea className="input-field" rows={3} {...register('observaciones')} />
          </div>

          <div className="flex space-x-4">
            <button type="submit" className="btn-primary flex items-center space-x-2" disabled={loading}>
              <Save size={18} />
              <span>{loading ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar'}</span>
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                reset()
                setSelectedDonadora(null)
                setEditingId(null)
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
        </div>
      )}

      {/* Listado de Sesiones */}
      {!showForm && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Sesiones de Transferencia</h2>
            <button onClick={loadData} className="btn-secondary">Refrescar</button>
          </div>

          {sesiones.length === 0 ? (
            <p className="text-gray-600 text-center py-6">No hay sesiones registradas</p>
          ) : (
            <div className="space-y-4">
              {sesiones.map((sesion, idx) => {
                const totalTransferencias = sesion.transferencias.length
                const conDonadora = sesion.transferencias.filter(t => t.donadora_id).length
                const estadios = new Set(sesion.transferencias.filter(t => t.estadio).map(t => t.estadio)).size

                return (
                  <div
                    key={idx}
                    className="border-2 border-teal-200 rounded-xl p-5 bg-gradient-to-br from-white to-teal-50/30 hover:shadow-lg transition-all duration-300 hover:border-teal-300"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-teal-600 to-cyan-600 p-3 rounded-xl shadow-md">
                          <Calendar className="text-white" size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {new Date(sesion.fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">Sesión de transferencias</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleEditSesion(sesion)}
                          className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-sm"
                        >
                          <Save size={16} />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => navigate(`/transferencia/${sesion.fecha}`)}
                          className="btn-primary flex items-center gap-1.5 px-3 py-2 text-sm"
                        >
                          <Eye size={16} />
                          <span>Ver Detalles</span>
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
                      <div className="bg-white/70 rounded-lg p-3 border border-purple-100">
                        <p className="text-xs text-purple-700 font-semibold uppercase mb-1">Con Donadora</p>
                        <p className="text-2xl font-bold text-purple-900">{conDonadora}</p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-3 border border-blue-100">
                        <p className="text-xs text-blue-700 font-semibold uppercase mb-1">Estadios</p>
                        <p className="text-2xl font-bold text-blue-900">{estadios}</p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-3 border border-cyan-100">
                        <p className="text-xs text-cyan-700 font-semibold uppercase mb-1">Tasa</p>
                        <p className="text-2xl font-bold text-cyan-900">
                          {totalTransferencias > 0 ? ((conDonadora / totalTransferencias) * 100).toFixed(0) : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Listado individual (solo si showForm está activo) */}
      {showForm && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Transferencias registradas</h2>
          {transferencias.length === 0 ? (
            <p className="text-gray-600">Aún no hay transferencias.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">N°</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Donadora</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Toro</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Receptora</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transferencias.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{t.numero_secuencial}</td>
                      <td className="px-4 py-2">
                        {t.donadora_id && donadorasMap[t.donadora_id]
                          ? donadorasMap[t.donadora_id].nombre
                          : '—'}
                      </td>
                      <td className="px-4 py-2">{t.toro || '—'}</td>
                      <td className="px-4 py-2">{t.receptora || '—'}</td>
                      <td className="px-4 py-2">
                        <div className="flex space-x-3">
                          <button
                            className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                            onClick={() => handleEdit(t)}
                          >
                            <Edit3 size={16} /> <span>Editar</span>
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800 flex items-center space-x-1"
                            onClick={() => handleDelete(t.id)}
                          >
                            <Trash2 size={16} /> <span>Eliminar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal de selección de donadora */}
      {showDonadoraModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-lg font-semibold">Seleccionar donadora</h3>
              <button onClick={() => setShowDonadoraModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Search size={16} className="text-gray-500" />
                <input
                  value={donadoraSearch}
                  onChange={(e) => setDonadoraSearch(e.target.value)}
                  className="input-field"
                  placeholder="Buscar por nombre o registro"
                  autoFocus
                />
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-200">
                {filteredDonadoras.length === 0 ? (
                  <p className="text-gray-600 text-center py-6">No se encontraron donadoras</p>
                ) : (
                  filteredDonadoras.map((donadora) => (
                    <button
                      key={donadora.id}
                      onClick={() => handleSelectDonadora(donadora)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <p className="font-medium text-gray-800">{donadora.nombre}</p>
                      <p className="text-sm text-gray-600">Registro: {donadora.numero_registro} • {donadora.raza}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
