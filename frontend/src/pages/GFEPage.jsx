import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Heart, Save, Edit3, Trash2, Plus } from 'lucide-react'
import { useGFEStore } from '../store/gfeStore'
import gfeService from '../services/gfeService'
import transferenciaService from '../services/transferenciaService'

export default function GFEPage() {
  const { chequeos, setChequeos, addChequeo, updateChequeo, removeChequeo } = useGFEStore()
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  const [editingId, setEditingId] = useState(null)
  const [transferencias, setTransferencias] = useState([])
  const [loading, setLoading] = useState(false)

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
    } catch (error) {
      console.error(error)
      alert('Error al guardar: ' + (error.response?.data?.detail || error.message))
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Heart className="text-primary" />
          <h1 className="text-3xl font-bold text-gray-800">Chequeos GFE</h1>
        </div>
        <button
          onClick={() => {
            reset()
            setEditingId(null)
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Nuevo chequeo</span>
        </button>
      </div>

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
    </div>
  )
}
