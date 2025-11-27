import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Save, Edit3, Trash2 } from 'lucide-react'
import { useTransferenciaStore } from '../store/transferenciaStore'
import transferenciaService from '../services/transferenciaService'
import donadoraService from '../services/donadoraService'
import DonadoraSelect from '../components/common/DonadoraSelect'

export default function TransferenciaPage() {
  const { transferencias, setTransferencias, addTransferencia, updateTransferencia, removeTransferencia } = useTransferenciaStore()
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  const [selectedDonadora, setSelectedDonadora] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [donadorasMap, setDonadorasMap] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
    preloadDonadoras()
  }, [])

  const preloadDonadoras = async () => {
    try {
      const data = await donadoraService.getAll()
      const map = data.reduce((acc, d) => ({ ...acc, [d.id]: d }), {})
      setDonadorasMap(map)
    } catch (error) {
      console.error('Error cargando donadoras', error)
    }
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
    } catch (error) {
      console.error(error)
      alert('Error al guardar: ' + (error.response?.data?.detail || error.message))
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
          Transferencia de embriones
        </h1>
        <button
          onClick={() => {
            reset()
            setSelectedDonadora(null)
            setEditingId(null)
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Nueva transferencia</span>
        </button>
      </div>

      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? 'Editar transferencia' : 'Registrar transferencia'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DonadoraSelect
              onSelect={setSelectedDonadora}
              selectedDonadora={selectedDonadora}
              helperText="Usa el buscador para traer la donadora"
            />

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
    </div>
  )
}
