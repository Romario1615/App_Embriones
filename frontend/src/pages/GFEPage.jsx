import { useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Heart, Save, Edit3, Trash2, Plus, Eye, Calendar, User, X } from 'lucide-react'
import { useGFEStore } from '../store/gfeStore'
import gfeService from '../services/gfeService'
import transferenciaService from '../services/transferenciaService'

export default function GFEPage() {
  const navigate = useNavigate()
  const { chequeos, setChequeos, addChequeo, updateChequeo, removeChequeo } = useGFEStore()
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  const [editingId, setEditingId] = useState(null)
  const [transferencias, setTransferencias] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadData()
    loadTransferencias()
  }, [])

  const loadData = async () => {
    try {
      const data = await gfeService.getAll()
      setChequeos(data)
    } catch (error) {
      console.error('Error cargando GFE', error)
    }
  }

  const loadTransferencias = async () => {
    try {
      const data = await transferenciaService.getAll()
      setTransferencias(data)
    } catch (error) {
      console.error('Error cargando transferencias', error)
    }
  }

  const onSubmit = async (data) => {
    setLoading(true)
    const payload = {
      ...data,
      transferencia_id: data.transferencia_id ? parseInt(data.transferencia_id, 10) : null
    }

    try {
      if (editingId) {
        const updated = await gfeService.update(editingId, payload)
        updateChequeo(editingId, updated)
        alert('Chequeo actualizado')
      } else {
        const created = await gfeService.create(payload)
        addChequeo(created)
        alert('Chequeo registrado')
      }
      reset()
      setEditingId(null)
      setShowForm(false)
    } catch (error) {
      console.error(error)
      alert('Error al guardar: ' + (error.response?.data?.detail || error.message))
    } finally {
      setLoading(false)
    }
  }

  // Agrupar chequeos por fecha y cliente (sesiones)
  const sesiones = useMemo(() => {
    const grupos = {}
    chequeos.forEach(c => {
      const key = `${c.fecha}|${c.cliente}`
      if (!grupos[key]) {
        grupos[key] = {
          fecha: c.fecha,
          cliente: c.cliente,
          chequeos: []
        }
      }
      grupos[key].chequeos.push(c)
    })
    return Object.values(grupos).sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  }, [chequeos])

  const handleEdit = (chequeo) => {
    setEditingId(chequeo.id)
    reset({
      transferencia_id: chequeo.transferencia_id || '',
      receptora: chequeo.receptora,
      tecnico_chequeo: chequeo.tecnico_chequeo,
      hacienda: chequeo.hacienda || '',
      fecha: chequeo.fecha,
      hora_inicio: chequeo.hora_inicio || '',
      hora_final: chequeo.hora_final || '',
      cliente: chequeo.cliente,
      estado: chequeo.estado,
      nota: chequeo.nota || ''
    })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar chequeo?')) return
    try {
      await gfeService.delete(id)
      removeChequeo(id)
    } catch (error) {
      console.error(error)
      alert('No se pudo eliminar')
    }
  }

  const handleEditSesion = async (sesion) => {
    // Abrir formulario para permitir agregar/editar chequeos de esta sesión
    setShowForm(true)
    // Limpiar formulario con datos de la sesión
    reset({
      transferencia_id: '',
      receptora: '',
      tecnico_chequeo: '',
      hacienda: '',
      fecha: sesion.fecha,
      hora_inicio: '',
      hora_final: '',
      cliente: sesion.cliente,
      estado: '',
      nota: ''
    })
    setEditingId(null)
  }

  const handleDeleteSesion = async (sesion) => {
    const mensaje = `¿Eliminar toda la sesión del ${new Date(sesion.fecha).toLocaleDateString()} con ${sesion.chequeos.length} chequeos?`
    if (!window.confirm(mensaje)) return

    try {
      // Eliminar todos los chequeos de la sesión
      await Promise.all(sesion.chequeos.map(c => gfeService.delete(c.id)))

      // Actualizar el store
      sesion.chequeos.forEach(c => removeChequeo(c.id))

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
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Heart className="text-pink-600" />
            Módulo de Chequeos GFE
          </h1>
          <p className="text-gray-600">Gestión de Folículos y Embriones</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm)
            if (!showForm) {
              reset()
              setEditingId(null)
            }
          }}
          className="btn-primary flex items-center space-x-2 self-start md:self-center"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          <span>{showForm ? 'Cerrar formulario' : 'Nuevo chequeo'}</span>
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Editar chequeo' : 'Registrar chequeo'}
          </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Receptora *</label>
              <input className="input-field" {...register('receptora', { required: 'Campo requerido' })} />
              {errors.receptora && <p className="text-red-500 text-sm">{errors.receptora.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Técnico *</label>
              <input className="input-field" {...register('tecnico_chequeo', { required: 'Campo requerido' })} />
              {errors.tecnico_chequeo && <p className="text-red-500 text-sm">{errors.tecnico_chequeo.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hacienda</label>
              <input className="input-field" {...register('hacienda')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
              <input className="input-field" {...register('cliente', { required: 'Campo requerido' })} />
              {errors.cliente && <p className="text-red-500 text-sm">{errors.cliente.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
              <input type="date" className="input-field" {...register('fecha', { required: 'Campo requerido' })} />
              {errors.fecha && <p className="text-red-500 text-sm">{errors.fecha.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
              <select className="input-field" {...register('estado', { required: 'Campo requerido' })}>
                <option value="">Seleccionar</option>
                <option value="prenada">Preñada</option>
                <option value="vacia">Vacía</option>
              </select>
              {errors.estado && <p className="text-red-500 text-sm">{errors.estado.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio</label>
              <input className="input-field" {...register('hora_inicio')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora final</label>
              <input className="input-field" {...register('hora_final')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transferencia (opcional)</label>
              <select className="input-field" {...register('transferencia_id')}>
                <option value="">Sin vincular</option>
                {transferencias.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id} - {t.receptora || 'receptora'} · {t.toro || 'toro'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nota</label>
            <textarea className="input-field" rows={3} {...register('nota')} />
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
            <h2 className="text-xl font-semibold">Sesiones de Chequeo GFE</h2>
            <button onClick={loadData} className="btn-secondary">Refrescar</button>
          </div>

          {sesiones.length === 0 ? (
            <p className="text-gray-600 text-center py-6">No hay sesiones registradas</p>
          ) : (
            <div className="space-y-4">
              {sesiones.map((sesion, idx) => {
                const totalChequeos = sesion.chequeos.length
                const prenadas = sesion.chequeos.filter(c => c.estado === 'prenada').length
                const vacias = sesion.chequeos.filter(c => c.estado === 'vacia').length
                const tasaExito = totalChequeos > 0 ? ((prenadas / totalChequeos) * 100).toFixed(0) : 0

                return (
                  <div
                    key={idx}
                    className="border-2 border-pink-200 rounded-xl p-5 bg-gradient-to-br from-white to-pink-50/30 hover:shadow-lg transition-all duration-300 hover:border-pink-300"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-pink-600 to-rose-600 p-3 rounded-xl shadow-md">
                          <Calendar className="text-white" size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {new Date(sesion.fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <User size={14} />
                            <span className="font-medium">{sesion.cliente}</span>
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
                          onClick={() => navigate(`/gfe/${sesion.fecha}/${encodeURIComponent(sesion.cliente)}`)}
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
                      <div className="bg-white/70 rounded-lg p-3 border border-pink-100">
                        <p className="text-xs text-pink-700 font-semibold uppercase mb-1">Total Chequeos</p>
                        <p className="text-2xl font-bold text-pink-900">{totalChequeos}</p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-3 border border-green-100">
                        <p className="text-xs text-green-700 font-semibold uppercase mb-1">Preñadas</p>
                        <p className="text-2xl font-bold text-green-900">{prenadas}</p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-3 border border-red-100">
                        <p className="text-xs text-red-700 font-semibold uppercase mb-1">Vacías</p>
                        <p className="text-2xl font-bold text-red-900">{vacias}</p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-3 border border-purple-100">
                        <p className="text-xs text-purple-700 font-semibold uppercase mb-1">Tasa Éxito</p>
                        <p className="text-2xl font-bold text-purple-900">{tasaExito}%</p>
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
          <h2 className="text-xl font-semibold mb-4">Chequeos registrados</h2>
          {chequeos.length === 0 ? (
            <p className="text-gray-600">Aún no hay chequeos.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Receptora</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Técnico</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {chequeos.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{c.receptora}</td>
                      <td className="px-4 py-2">{new Date(c.fecha).toLocaleDateString()}</td>
                      <td className="px-4 py-2 capitalize">{c.estado}</td>
                      <td className="px-4 py-2">{c.tecnico_chequeo}</td>
                      <td className="px-4 py-2">
                        <div className="flex space-x-3">
                          <button
                            className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                            onClick={() => handleEdit(c)}
                          >
                            <Edit3 size={16} /> <span>Editar</span>
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800 flex items-center space-x-1"
                            onClick={() => handleDelete(c.id)}
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
    </div>
  )
}
