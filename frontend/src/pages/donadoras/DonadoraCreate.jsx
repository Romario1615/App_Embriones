/**
 * Página de creación de donadora
 */
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Save, X } from 'lucide-react'
import donadoraService from '../../services/donadoraService'
import fotoService from '../../services/fotoService'
import { useDonadoraStore } from '../../store/donadoraStore'
import PhotoCapture from '../../components/PhotoCapture'

export default function DonadoraCreate() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      activo: true
    }
  })
  const [photos, setPhotos] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const isSubmittingRef = useRef(false)
  const { addDonadora } = useDonadoraStore()

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

      // Create new donadora
      const created = await donadoraService.create(payload)
      addDonadora(created)
      const donadoraId = created.id

      // Upload photos
      if (photos.length > 0) {
        try {
          for (let i = 0; i < photos.length; i++) {
            const foto = photos[i]
            if (foto.file) {
              await fotoService.upload('donadora', donadoraId, foto.file, i)
            }
          }
        } catch (error) {
          console.error('Error subiendo fotos:', error)
          alert('Donadora creada, pero hubo un error al subir algunas fotos')
        }
      }

      alert('Donadora creada exitosamente')
      navigate(`/donadoras/${donadoraId}`)
    } catch (error) {
      console.error('Error:', error)
      const detail = error.response?.data?.detail
      const message = Array.isArray(detail)
        ? detail.map(d => (d.msg || d.detail || JSON.stringify(d))).join(' | ')
        : (detail || error.message)
      alert('Error al crear donadora: ' + message)
    } finally {
      setSubmitting(false)
      isSubmittingRef.current = false
    }
  }

  const handleCancel = () => {
    if (window.confirm('¿Deseas cancelar la creación? Los cambios no guardados se perderán.')) {
      navigate('/donadoras')
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/donadoras')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Volver al listado
        </button>
        <h1 className="text-3xl font-bold text-gray-800">
          Nueva Donadora
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
                {errors.raza && (
                  <p className="text-red-500 text-sm mt-1">Raza requerida</p>
                )}
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
                {errors.tipo_ganado && (
                  <p className="text-red-500 text-sm mt-1">Tipo de ganado requerido</p>
                )}
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
                {errors.propietario_nombre && (
                  <p className="text-red-500 text-sm mt-1">Nombre del propietario requerido</p>
                )}
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
                {submitting ? 'Guardando...' : 'Crear Donadora'}
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
