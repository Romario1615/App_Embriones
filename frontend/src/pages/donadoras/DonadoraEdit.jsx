/**
 * Página de edición de donadora
 */
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Save, X } from 'lucide-react'
import donadoraService from '../../services/donadoraService'
import fotoService from '../../services/fotoService'
import { useDonadoraStore } from '../../store/donadoraStore'
import PhotoCapture from '../../components/PhotoCapture'

export default function DonadoraEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors }, reset } = useForm()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const isSubmittingRef = useRef(false)
  const { updateDonadora } = useDonadoraStore()

  useEffect(() => {
    loadDonadora()
  }, [id])

  const loadDonadora = async () => {
    try {
      const data = await donadoraService.getById(id)

      // Reset form with editable fields
      const editableData = {
        nombre: data.nombre || '',
        numero_registro: data.numero_registro || '',
        raza: data.raza || '',
        tipo_ganado: data.tipo_ganado || '',
        propietario_nombre: data.propietario_nombre || '',
        fecha_nacimiento: data.fecha_nacimiento || '',
        propietario_contacto: data.propietario_contacto || '',
        peso_kg: data.peso_kg || '',
        notas: data.notas || '',
        activo: data.activo !== undefined ? data.activo : true
      }

      reset(editableData)

      // Load existing photos
      try {
        const fotosData = await fotoService.getByEntidad('donadora', parseInt(id))
        const fotosFormateadas = fotosData.fotos.map(foto => ({
          id: foto.id,
          preview: foto.thumbnail_url || foto.url,
          url: foto.url,
          name: `Foto ${foto.orden + 1}`,
          existente: true,
          fotoId: foto.id
        }))
        setPhotos(fotosFormateadas)
      } catch (error) {
        console.log('No hay fotos para esta donadora o error cargando:', error)
        setPhotos([])
      }
    } catch (error) {
      console.error('Error cargando donadora:', error)
      alert('Error al cargar la donadora')
      navigate('/donadoras')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    // Prevent concurrent submissions
    if (isSubmittingRef.current) {
      console.warn('Ya hay un envío en progreso, ignorando...')
      return
    }

    isSubmittingRef.current = true
    setSubmitting(true)

    try {
      // Normalize payload avoiding empty strings and converting numbers
      const payload = { ...data }
      if (!payload.fecha_nacimiento) delete payload.fecha_nacimiento
      if (!payload.propietario_contacto) delete payload.propietario_contacto
      if (!payload.notas) delete payload.notas
      if (payload.peso_kg === '' || payload.peso_kg === null || payload.peso_kg === undefined) {
        delete payload.peso_kg
      } else {
        payload.peso_kg = parseFloat(payload.peso_kg)
      }

      // Convert activo to boolean if exists (comes as string from select)
      if (payload.activo !== undefined) {
        payload.activo = payload.activo === 'true' || payload.activo === true
      }

      // Update donadora
      const updated = await donadoraService.update(id, payload)
      updateDonadora(parseInt(id), updated)

      // Handle photos
      // 1. Separate new from existing photos
      const fotosNuevas = photos.filter(p => !p.existente && p.file)
      const fotosExistentes = photos.filter(p => p.existente)

      // 2. Delete removed photos
      try {
        const fotosActuales = await fotoService.getByEntidad('donadora', parseInt(id))
        const fotosIdExistentes = fotosExistentes.map(f => f.fotoId)

        // Delete photos that are no longer present
        for (const foto of fotosActuales.fotos) {
          if (!fotosIdExistentes.includes(foto.id)) {
            await fotoService.delete(foto.id)
          }
        }
      } catch (error) {
        console.error('Error eliminando fotos:', error)
      }

      // 3. Upload new photos
      if (fotosNuevas.length > 0) {
        try {
          for (let i = 0; i < fotosNuevas.length; i++) {
            const foto = fotosNuevas[i]
            const orden = fotosExistentes.length + i
            await fotoService.upload('donadora', parseInt(id), foto.file, orden)
          }
        } catch (error) {
          console.error('Error subiendo fotos:', error)
          alert('Donadora actualizada, pero hubo un error al subir algunas fotos')
        }
      }

      alert('Donadora actualizada exitosamente')
      navigate(`/donadoras/${id}`)
    } catch (error) {
      console.error('Error:', error)
      const detail = error.response?.data?.detail
      const message = Array.isArray(detail)
        ? detail.map(d => (d.msg || d.detail || JSON.stringify(d))).join(' | ')
        : (detail || error.message)
      alert('Error al actualizar donadora: ' + message)
    } finally {
      setSubmitting(false)
      isSubmittingRef.current = false
    }
  }

  const handleCancel = () => {
    if (window.confirm('¿Deseas cancelar la edición? Los cambios no guardados se perderán.')) {
      navigate(`/donadoras/${id}`)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/donadoras/${id}`)}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Volver a la ficha
        </button>
        <h1 className="text-3xl font-bold text-gray-800">
          Editar Donadora
        </h1>
      </div>

      {/* Form */}
      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Información Básica */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
              Información Básica
            </h2>
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
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  {...register('fecha_nacimiento')}
                  className="input-field"
                />
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
                  placeholder="Ej: 450.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select {...register('activo')} className="input-field">
                  <option value="true">Activa</option>
                  <option value="false">Inactiva</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Las donadoras inactivas no aparecen en las listas principales
                </p>
              </div>
            </div>
          </div>

          {/* Información del Propietario */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
              Información del Propietario
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Propietario *
                </label>
                <input
                  {...register('propietario_nombre', { required: true })}
                  className="input-field"
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contacto del Propietario
                </label>
                <input
                  {...register('propietario_contacto')}
                  className="input-field"
                  placeholder="Ej: +57 300 123 4567"
                />
              </div>
            </div>
          </div>

          {/* Fotografías */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
              Fotografías
            </h2>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fotografías (hasta 6)
            </label>
            <PhotoCapture
              photos={photos}
              onChange={setPhotos}
              maxPhotos={6}
            />
          </div>

          {/* Notas */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
              Notas Adicionales
            </h2>
            <textarea
              {...register('notas')}
              className="input-field"
              rows={4}
              placeholder="Información adicional sobre la donadora..."
            />
          </div>

          {/* Buttons */}
          <div className="flex space-x-4 pt-4 border-t">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              <Save size={20} />
              <span>
                {submitting ? 'Guardando...' : 'Guardar Cambios'}
              </span>
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary flex items-center space-x-2"
            >
              <X size={20} />
              <span>Cancelar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
