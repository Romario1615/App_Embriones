import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, User, Phone, Scale, Edit, Trash2, X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react'
import donadoraService from '../../services/donadoraService'
import fotoService from '../../services/fotoService'
import { useDonadoraStore } from '../../store/donadoraStore'
import { API_BASE_URL } from '../../services/api'

export default function DonadoraDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [donadora, setDonadora] = useState(null)
  const [fotos, setFotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null)
  const { removeDonadora } = useDonadoraStore()

  useEffect(() => {
    loadDonadora()
    loadFotos()
  }, [id])

  const loadDonadora = async () => {
    try {
      const data = await donadoraService.getById(id)
      setDonadora(data)
    } catch (error) {
      console.error('Error cargando donadora:', error)
      alert('Error al cargar la donadora')
    } finally {
      setLoading(false)
    }
  }

  const loadFotos = async () => {
    try {
      const fotosData = await fotoService.getByEntidad('donadora', parseInt(id))
      setFotos(fotosData.fotos || [])
    } catch (error) {
      console.log('No hay fotos para esta donadora:', error)
      setFotos([])
    }
  }

  const nextPhoto = () => {
    setSelectedPhotoIndex((prev) => (prev + 1) % fotos.length)
  }

  const prevPhoto = () => {
    setSelectedPhotoIndex((prev) => (prev - 1 + fotos.length) % fotos.length)
  }

  const handleDelete = async () => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar a ${donadora.nombre}? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      await donadoraService.delete(id)
      removeDonadora(parseInt(id))
      alert('Donadora eliminada exitosamente')
      navigate('/donadoras')
    } catch (error) {
      console.error('Error eliminando donadora:', error)
      alert('Error al eliminar la donadora: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleEdit = () => {
    navigate(`/donadoras/${id}/edit`)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600">Cargando...</p>
      </div>
    )
  }

  if (!donadora) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Donadora no encontrada</p>
        <button onClick={() => navigate('/donadoras')} className="btn-primary mt-4">
          Volver al listado
        </button>
      </div>
    )
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
            Ficha de Donadora
          </h1>
          <div className="flex space-x-3">
            <button
              onClick={handleEdit}
              className="btn-primary flex items-center space-x-2"
            >
              <Edit size={18} />
              <span>Editar</span>
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center space-x-2"
            >
              <Trash2 size={18} />
              <span>Eliminar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Información principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Fotos */}
        <div className="lg:col-span-1">
          <div className="card">
            {fotos.length > 0 ? (
              <div className="space-y-4">
                {/* Foto principal */}
                <div className="relative group">
                  <img
                    src={fotos[0].thumbnail_url || fotos[0].url}
                    alt={`${donadora.nombre} - Foto 1`}
                    className="w-full h-64 object-cover rounded-lg cursor-pointer"
                    onClick={() => setSelectedPhotoIndex(0)}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x300?text=Sin+Foto'
                    }}
                  />
                  <button
                    onClick={() => setSelectedPhotoIndex(0)}
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Ver imagen completa"
                  >
                    <ZoomIn size={20} />
                  </button>
                  {fotos.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                      1 de {fotos.length}
                    </div>
                  )}
                </div>

                {/* Miniaturas si hay más fotos */}
                {fotos.length > 1 && (
                  <div className="grid grid-cols-3 gap-2">
                    {fotos.slice(1).map((foto, index) => (
                      <div key={foto.id} className="relative group cursor-pointer" onClick={() => setSelectedPhotoIndex(index + 1)}>
                        <img
                          src={foto.thumbnail_url || foto.url}
                          alt={`${donadora.nombre} - Foto ${index + 2}`}
                          className="w-full h-20 object-cover rounded-lg border-2 border-gray-200 hover:border-primary transition-colors"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/100x100?text=Foto'
                          }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center">
                          <ZoomIn size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center mb-4">
                <p className="text-gray-500">Sin fotografías</p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar size={16} className="mr-2" />
                <span>Registrada: {new Date(donadora.fecha_creacion).toLocaleDateString()}</span>
              </div>
              {donadora.fecha_actualizacion && (
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar size={16} className="mr-2" />
                  <span>Actualizada: {new Date(donadora.fecha_actualizacion).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna derecha - Información */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos básicos */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
              Información Básica
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Nombre</label>
                <p className="text-lg font-semibold text-gray-800">{donadora.nombre}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Número de Registro</label>
                <p className="text-lg font-semibold text-gray-800">{donadora.numero_registro}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Raza</label>
                <p className="text-gray-800">{donadora.raza}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Tipo de Ganado</label>
                <p className="text-gray-800 capitalize">{donadora.tipo_ganado}</p>
              </div>
              {donadora.fecha_nacimiento && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Fecha de Nacimiento</label>
                  <p className="text-gray-800">{new Date(donadora.fecha_nacimiento).toLocaleDateString()}</p>
                </div>
              )}
              {donadora.peso_kg && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Peso</label>
                  <div className="flex items-center text-gray-800">
                    <Scale size={18} className="mr-2 text-gray-500" />
                    <span>{donadora.peso_kg} kg</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Información del propietario */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
              Información del Propietario
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Nombre del Propietario</label>
                <div className="flex items-center text-gray-800">
                  <User size={18} className="mr-2 text-gray-500" />
                  <span>{donadora.propietario_nombre}</span>
                </div>
              </div>
              {donadora.propietario_contacto && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Contacto</label>
                  <div className="flex items-center text-gray-800">
                    <Phone size={18} className="mr-2 text-gray-500" />
                    <span>{donadora.propietario_contacto}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notas */}
          {donadora.notas && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
                Notas Adicionales
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap">{donadora.notas}</p>
            </div>
          )}

          {/* Estado */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
              Estado
            </h2>
            <div className="flex items-center">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                donadora.activo
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {donadora.activo ? 'Activa' : 'Inactiva'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de galería de imágenes */}
      {selectedPhotoIndex !== null && fotos.length > 0 && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhotoIndex(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full">
            {/* Botón cerrar */}
            <button
              onClick={() => setSelectedPhotoIndex(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
              title="Cerrar"
            >
              <X size={32} />
            </button>

            {/* Botones de navegación */}
            {fotos.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    prevPhoto()
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                  title="Foto anterior"
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    nextPhoto()
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                  title="Foto siguiente"
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}

            {/* Imagen */}
            <img
              src={fotos[selectedPhotoIndex].url}
              alt={`${donadora.nombre} - Foto ${selectedPhotoIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain mx-auto rounded-lg"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/800x600?text=Imagen+No+Disponible'
              }}
            />

            {/* Info */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-4 rounded-b-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">{donadora.nombre}</p>
                  <p className="text-sm text-gray-300">{donadora.numero_registro}</p>
                </div>
                {fotos.length > 1 && (
                  <div className="text-sm">
                    Foto {selectedPhotoIndex + 1} de {fotos.length}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
