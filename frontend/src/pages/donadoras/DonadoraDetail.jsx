import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, User, Phone, Scale, Edit, Trash2 } from 'lucide-react'
import donadoraService from '../../services/donadoraService'
import { useDonadoraStore } from '../../store/donadoraStore'
import { API_BASE_URL } from '../../services/api'

export default function DonadoraDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [donadora, setDonadora] = useState(null)
  const [loading, setLoading] = useState(true)
  const { removeDonadora } = useDonadoraStore()

  useEffect(() => {
    loadDonadora()
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
    navigate(`/donadoras?edit=${id}`)
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
    <div>
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
        {/* Columna izquierda - Foto */}
        <div className="lg:col-span-1">
          <div className="card">
            {donadora.foto_ruta ? (
              <img
                src={`${API_BASE_URL.startsWith('http') ? API_BASE_URL.replace(/\/api\/v1\/?$/, '') : ''}${donadora.foto_ruta}`}
                alt={donadora.nombre}
                className="w-full h-auto rounded-lg mb-4"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/400x300?text=Sin+Foto'
                }}
              />
            ) : (
              <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center mb-4">
                <p className="text-gray-500">Sin fotografía</p>
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
    </div>
  )
}
