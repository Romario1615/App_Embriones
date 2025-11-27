/**
 * Página de gestión de donadoras con autosave
 */
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Save, Eye, X } from 'lucide-react'
import { useDonadoraStore } from '../../store/donadoraStore'
import { useAutosave } from '../../hooks/useAutosave'
import donadoraService from '../../services/donadoraService'
import draftService from '../../services/draftService'

export default function DonadorasPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm()
  const [foto, setFoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const { donadoras, addDonadora, setDonadoras, updateDonadora } = useDonadoraStore()

  const formData = watch()

  // Autosave cada 3 segundos
  useAutosave('donadora', 'create', formData, showForm)

  useEffect(() => {
    loadDonadoras()
    loadDraft()

    // Detectar si viene parámetro de edición
    const editId = searchParams.get('edit')
    if (editId) {
      loadDonadoraForEdit(editId)
    }
  }, [searchParams])

  const loadDonadoras = async () => {
    try {
      const data = await donadoraService.getAll()
      // Mostrar solo activas (soft delete marca activo=false)
      setDonadoras(data.filter(d => d.activo))
    } catch (error) {
      console.error('Error cargando donadoras:', error)
    }
  }

  const loadDraft = async () => {
    try {
      const drafts = await draftService.getUserDrafts('donadora', 'create')
      if (drafts.length > 0) {
        const draft = drafts[0]
        reset(draft.datos_json)
        console.log('✅ Draft recuperado')
      }
    } catch (error) {
      console.error('Error cargando draft:', error)
    }
  }

  const loadDonadoraForEdit = async (id) => {
    try {
      const data = await donadoraService.getById(id)
      setEditingId(parseInt(id))

      // Only reset with editable fields
      const editableData = {
        nombre: data.nombre || '',
        numero_registro: data.numero_registro || '',
        raza: data.raza || '',
        tipo_ganado: data.tipo_ganado || '',
        propietario_nombre: data.propietario_nombre || '',
        fecha_nacimiento: data.fecha_nacimiento || '',
        propietario_contacto: data.propietario_contacto || '',
        peso_kg: data.peso_kg || '',
        notas: data.notas || ''
      }

      reset(editableData)
      if (data.foto_ruta) {
        setPreview(`http://localhost:8000${data.foto_ruta}`)
      }
      setShowForm(true)
    } catch (error) {
      console.error('Error cargando donadora para editar:', error)
      alert('Error al cargar la donadora')
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFoto(file)
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      // Normalizar payload evitando strings vacíos y convirtiendo números
      const payload = { ...data }
      if (!payload.fecha_nacimiento) delete payload.fecha_nacimiento
      if (!payload.propietario_contacto) delete payload.propietario_contacto
      if (!payload.notas) delete payload.notas
      if (payload.peso_kg === '' || payload.peso_kg === null || payload.peso_kg === undefined) {
        delete payload.peso_kg
      } else {
        payload.peso_kg = parseFloat(payload.peso_kg)
      }

      if (editingId) {
        // Actualizar donadora existente
        const updated = await donadoraService.update(editingId, payload, foto)
        updateDonadora(editingId, updated)
        alert('Donadora actualizada exitosamente')
      } else {
        // Crear nueva donadora
        const created = await donadoraService.create(payload, foto)
        addDonadora(created)

        // Eliminar draft
        const drafts = await draftService.getUserDrafts('donadora', 'create')
        if (drafts.length > 0) {
          await draftService.delete(drafts[0].id)
        }

        alert('Donadora creada exitosamente')
      }

      handleCancelEdit()
    } catch (error) {
      console.error('Error:', error)
      const detail = error.response?.data?.detail
      const message = Array.isArray(detail)
        ? detail.map(d => (d.msg || d.detail || JSON.stringify(d))).join(' | ')
        : (detail || error.message)
      alert('Error al guardar donadora: ' + message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    reset()
    setFoto(null)
    setPreview(null)
    setShowForm(false)
    setEditingId(null)
    setSearchParams({})  // Limpiar parámetros de URL
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
          Gestión de Donadoras
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Nueva Donadora</span>
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Editar Donadora' : 'Registrar Nueva Donadora'}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            ℹ️ Los cambios se guardan automáticamente cada 3 segundos
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  {...register('nombre', { required: 'Nombre requerido' })}
                  className="input-field"
                  placeholder="Ej: Vaca Estrella"
                />
                {errors.nombre && (
                  <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Registro *
                </label>
                <input
                  {...register('numero_registro', { required: 'Número requerido' })}
                  className="input-field"
                  placeholder="Ej: 56784"
                />
                {errors.numero_registro && (
                  <p className="text-red-500 text-sm mt-1">{errors.numero_registro.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Raza *
                </label>
                <select {...register('raza', { required: true })} className="input-field">
                  <option value="">Seleccionar</option>
                  <option value="Holstein">Holstein</option>
                  <option value="Angus">Angus</option>
                  <option value="Brahman">Brahman</option>
                  <option value="Jersey">Jersey</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Ganado *
                </label>
                <select {...register('tipo_ganado', { required: true })} className="input-field">
                  <option value="">Seleccionar</option>
                  <option value="carne">Carne</option>
                  <option value="leche">Leche</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Propietario *
                </label>
                <input
                  {...register('propietario_nombre', { required: true })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contacto del Propietario
                </label>
                <input {...register('propietario_contacto')} className="input-field" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('peso_kg')}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fotografía
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="input-field"
                />
                {preview && (
                  <img src={preview} alt="Preview" className="mt-2 h-32 w-32 object-cover rounded-lg" />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas Adicionales
              </label>
              <textarea {...register('notas')} className="input-field" rows={3} />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                <Save size={20} />
                <span>
                  {loading ? 'Guardando...' : editingId ? 'Actualizar Donadora' : 'Guardar Donadora'}
                </span>
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Donadoras */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Donadoras Registradas</h2>

        {donadoras.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            No hay donadoras registradas. Crea una nueva para comenzar.
          </p>
        ) : (
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
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {donadoras.map(donadora => (
                  <tr key={donadora.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">{donadora.nombre}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{donadora.numero_registro}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{donadora.raza}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{donadora.tipo_ganado}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{donadora.propietario_nombre}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/donadoras/${donadora.id}`)}
                        className="flex items-center space-x-1 text-primary hover:text-primary-dark transition-colors"
                        title="Ver ficha completa"
                      >
                        <Eye size={18} />
                        <span className="text-sm">Ver detalle</span>
                      </button>
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
