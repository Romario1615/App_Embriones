import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Save, Edit3, Trash2 } from 'lucide-react'
import { useFecundacionStore } from '../store/fecundacionStore'
import fecundacionService from '../services/fecundacionService'
import donadoraService from '../services/donadoraService'
import DonadoraSelect from '../components/common/DonadoraSelect'

export default function FecundacionPage() {
  const { registros, setRegistros, addRegistro, updateRegistro, removeRegistro } = useFecundacionStore()
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedDonadora, setSelectedDonadora] = useState(null)
  const [donadorasMap, setDonadorasMap] = useState({})

  useEffect(() => {
    loadRegistros()
    preloadDonadoras()
  }, [])

  const preloadDonadoras = async () => {
    try {
      const data = await donadoraService.getAll()
      const map = data.reduce((acc, d) => {
        acc[d.id] = d
        return acc
      }, {})
      setDonadorasMap(map)
    } catch (error) {
      console.error('Error precargando donadoras', error)
    }
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
    } catch (error) {
      console.error(error)
      alert('Error al guardar: ' + (error.response?.data?.detail || error.message))
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
          Fecundación in vitro
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
          <span>Nuevo registro</span>
        </button>
      </div>

      {/* Formulario */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? 'Editar fecundación' : 'Registrar fecundación'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DonadoraSelect
              onSelect={setSelectedDonadora}
              selectedDonadora={selectedDonadora}
              helperText="Escribe 2+ letras para buscar la donadora"
            />

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

      {/* Listado */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Registros de fecundación</h2>
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
    </div>
  )
}
