import { useEffect, useState, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Plus, Save, Edit3, Trash2, Eye, Calendar, User, X, Search } from 'lucide-react'
import { useFecundacionStore } from '../store/fecundacionStore'
import fecundacionService from '../services/fecundacionService'
import donadoraService from '../services/donadoraService'

export default function FecundacionPage() {
  const navigate = useNavigate()
  const { registros, setRegistros, addRegistro, updateRegistro, removeRegistro } = useFecundacionStore()
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedDonadora, setSelectedDonadora] = useState(null)
  const [donadorasMap, setDonadorasMap] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [donadorasList, setDonadorasList] = useState([])
  const [donadoraSearch, setDonadoraSearch] = useState('')
  const [showDonadoraModal, setShowDonadoraModal] = useState(false)
  const isSubmittingRef = useRef(false)

  useEffect(() => {
    loadRegistros()
    preloadDonadoras()
    loadDonadoras()
  }, [])

  const preloadDonadoras = async () => {
    try {
      const response = await donadoraService.getAll({ limit: 1000 })
      const donadoras = response.donadoras || []
      const map = donadoras.reduce((acc, d) => {
        acc[d.id] = d
        return acc
      }, {})
      setDonadorasMap(map)
    } catch (error) {
      console.error('Error precargando donadoras', error)
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

  const loadRegistros = async () => {
    try {
      const data = await fecundacionService.getAll()
      setRegistros(data)
    } catch (error) {
      console.error('Error cargando fecundaciones:', error)
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
      donadora_id: selectedDonadora?.id || null,
      temperatura: data.temperatura ? parseFloat(data.temperatura) : null
    }

    try {
      if (editingId) {
        const updated = await fecundacionService.update(editingId, payload)
        updateRegistro(editingId, updated)
        alert('Fecundación actualizada')
      } else {
        const created = await fecundacionService.create(payload)
        addRegistro(created)
        alert('Fecundación registrada')
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

  // Agrupar registros por fecha y laboratorista (sesiones)
  const sesiones = useMemo(() => {
    const grupos = {}
    registros.forEach(reg => {
      const key = `${reg.fecha_inicio_maduracion}|${reg.laboratorista}`
      if (!grupos[key]) {
        grupos[key] = {
          fecha: reg.fecha_inicio_maduracion,
          laboratorista: reg.laboratorista,
          registros: []
        }
      }
      const donadora = donadorasMap[reg.donadora_id]
      grupos[key].registros.push({ ...reg, donadora })
    })
    return Object.values(grupos).sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  }, [registros, donadorasMap])

  const handleEdit = async (registro) => {
    setEditingId(registro.id)
    reset({
      laboratorista: registro.laboratorista,
      fecha_inicio_maduracion: registro.fecha_inicio_maduracion,
      hora_inicio_maduracion: registro.hora_inicio_maduracion || '',
      medio_maduracion: registro.medio_maduracion || '',
      temperatura: registro.temperatura || '',
      tiempo_maduracion: registro.tiempo_maduracion || '',
      fecha_fertilizacion: registro.fecha_fertilizacion || '',
      hora_fertilizacion: registro.hora_fertilizacion || '',
      semen_utilizado: registro.semen_utilizado || '',
      medio_fertilizacion: registro.medio_fertilizacion || '',
      concentracion_espermatica: registro.concentracion_espermatica || '',
      tiempo_coincubacion: registro.tiempo_coincubacion || ''
    })

    if (registro.donadora_id && donadorasMap[registro.donadora_id]) {
      setSelectedDonadora(donadorasMap[registro.donadora_id])
    } else if (registro.donadora_id) {
      const data = await donadoraService.getById(registro.donadora_id)
      setSelectedDonadora(data)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este registro?')) return
    try {
      await fecundacionService.delete(id)
      removeRegistro(id)
    } catch (error) {
      console.error(error)
      alert('No se pudo eliminar')
    }
  }

  const handleEditSesion = async (sesion) => {
    // Abrir formulario para permitir agregar/editar registros de esta sesión
    setShowForm(true)
    // Cargar el primer registro como referencia
    if (sesion.registros.length > 0) {
      const primerRegistro = sesion.registros[0]
      reset({
        laboratorista: primerRegistro.laboratorista,
        fecha_inicio_maduracion: primerRegistro.fecha_inicio_maduracion,
        hora_inicio_maduracion: '',
        medio_maduracion: '',
        temperatura: '',
        tiempo_maduracion: '',
        fecha_fertilizacion: '',
        hora_fertilizacion: '',
        semen_utilizado: '',
        medio_fertilizacion: '',
        concentracion_espermatica: '',
        tiempo_coincubacion: ''
      })
    }
  }

  const handleDeleteSesion = async (sesion) => {
    const mensaje = `¿Eliminar toda la sesión del ${new Date(sesion.fecha).toLocaleDateString()} con ${sesion.registros.length} registros?`
    if (!window.confirm(mensaje)) return

    try {
      // Eliminar todos los registros de la sesión
      await Promise.all(sesion.registros.map(reg => fecundacionService.delete(reg.id)))

      // Actualizar el store
      sesion.registros.forEach(reg => removeRegistro(reg.id))

      alert('Sesión eliminada correctamente')
    } catch (error) {
      console.error(error)
      alert('Error al eliminar la sesión')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Módulo de Fecundación IVF</h1>
          <p className="text-gray-600">Gestiona sesiones de fecundación in vitro</p>
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
          <span>{showForm ? 'Cerrar formulario' : 'Nuevo registro'}</span>
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Editar fecundación' : 'Registrar fecundación'}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Laboratorista *</label>
              <input
                className="input-field"
                {...register('laboratorista', { required: 'Laboratorista requerido' })}
              />
              {errors.laboratorista && <p className="text-red-500 text-sm">{errors.laboratorista.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inicio maduración *</label>
              <input
                type="date"
                className="input-field"
                {...register('fecha_inicio_maduracion', { required: 'Fecha requerida' })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio</label>
              <input className="input-field" {...register('hora_inicio_maduracion')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medio maduración</label>
              <input className="input-field" {...register('medio_maduracion')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temperatura (°C)</label>
              <input type="number" step="0.1" className="input-field" {...register('temperatura')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo maduración</label>
              <input className="input-field" {...register('tiempo_maduracion')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fertilización</label>
              <input type="date" className="input-field" {...register('fecha_fertilizacion')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora fertilización</label>
              <input className="input-field" {...register('hora_fertilizacion')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semen utilizado</label>
              <input className="input-field" {...register('semen_utilizado')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medio fertilización</label>
              <input className="input-field" {...register('medio_fertilizacion')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Concentración espermática</label>
              <input className="input-field" {...register('concentracion_espermatica')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo coincubación</label>
              <input className="input-field" {...register('tiempo_coincubacion')} />
            </div>
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
              Limpiar
            </button>
          </div>
        </form>
      </div>
      )}

      {/* Listado de Sesiones */}
      {!showForm && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Sesiones de Fecundación</h2>
            <button onClick={loadRegistros} className="btn-secondary">Refrescar</button>
          </div>

          {sesiones.length === 0 ? (
            <p className="text-gray-600 text-center py-6">No hay sesiones registradas</p>
          ) : (
            <div className="space-y-4">
              {sesiones.map((sesion, idx) => {
                const totalRegistros = sesion.registros.length
                const conTemperatura = sesion.registros.filter(r => r.temperatura != null).length
                const conFertilizacion = sesion.registros.filter(r => r.fecha_fertilizacion).length

                return (
                  <div
                    key={idx}
                    className="border-2 border-purple-200 rounded-xl p-5 bg-gradient-to-br from-white to-purple-50/30 hover:shadow-lg transition-all duration-300 hover:border-purple-300"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-3 rounded-xl shadow-md">
                          <Calendar className="text-white" size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {new Date(sesion.fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <User size={14} />
                            <span className="font-medium">{sesion.laboratorista}</span>
                          </div>
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
                          onClick={() => navigate(`/fecundacion/${sesion.fecha}/${encodeURIComponent(sesion.laboratorista)}`)}
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
                      <div className="bg-white/70 rounded-lg p-3 border border-purple-100">
                        <p className="text-xs text-purple-700 font-semibold uppercase mb-1">Registros</p>
                        <p className="text-2xl font-bold text-purple-900">{totalRegistros}</p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-3 border border-red-100">
                        <p className="text-xs text-red-700 font-semibold uppercase mb-1">Con Temperatura</p>
                        <p className="text-2xl font-bold text-red-900">{conTemperatura}</p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-3 border border-green-100">
                        <p className="text-xs text-green-700 font-semibold uppercase mb-1">Fertilizados</p>
                        <p className="text-2xl font-bold text-green-900">{conFertilizacion}</p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-3 border border-blue-100">
                        <p className="text-xs text-blue-700 font-semibold uppercase mb-1">Tasa</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {totalRegistros > 0 ? ((conFertilizacion / totalRegistros) * 100).toFixed(0) : 0}%
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
          <h2 className="text-xl font-semibold mb-4">Registros individuales</h2>
        {registros.length === 0 ? (
          <p className="text-gray-600">Aún no hay registros.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Donadora</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Laboratorista</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Inicio maduración</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Fertilización</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {registros.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      {reg.donadora_id && donadorasMap[reg.donadora_id]
                        ? donadorasMap[reg.donadora_id].nombre
                        : '—'}
                    </td>
                    <td className="px-4 py-2">{reg.laboratorista}</td>
                    <td className="px-4 py-2">
                      {reg.fecha_inicio_maduracion ? new Date(reg.fecha_inicio_maduracion).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-2">
                      {reg.fecha_fertilizacion ? new Date(reg.fecha_fertilizacion).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex space-x-3">
                        <button
                          className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                          onClick={() => handleEdit(reg)}
                        >
                          <Edit3 size={16} /> <span>Editar</span>
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800 flex items-center space-x-1"
                          onClick={() => handleDelete(reg.id)}
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
