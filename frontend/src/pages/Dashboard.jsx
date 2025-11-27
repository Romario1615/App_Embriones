/**
 * Página Dashboard principal
 */
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Dashboard() {
  const user = useAuthStore(state => state.user)

  const modules = [
    {
      path: '/donadoras',
      title: 'Donadoras',
      icon: '🐄',
      description: 'Gestión de vacas donantes',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      path: '/opu',
      title: 'OPU',
      icon: '🔬',
      description: 'Sesiones de extracción de ovocitos',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      path: '/fecundacion',
      title: 'Fecundación',
      icon: '🧬',
      description: 'Fertilización in vitro',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      path: '/transferencia',
      title: 'Transferencia',
      icon: '💉',
      description: 'Transferencia de embriones',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    },
    {
      path: '/gfe',
      title: 'GFE',
      icon: '✅',
      description: 'Chequeos de gestación',
      color: 'bg-teal-500 hover:bg-teal-600'
    },
  ]

  return (
    <div>
      {/* Bienvenida */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          Bienvenido, {user?.nombre_completo}
        </h1>
        <p className="text-gray-600">Rol: {user?.rol}</p>
      </div>

      {/* Grid de Módulos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map(module => (
          <Link
            key={module.path}
            to={module.path}
            className={`${module.color} text-white rounded-xl shadow-lg p-6 transition-all transform hover:scale-105 hover:shadow-xl`}
          >
            <div className="text-5xl mb-4">{module.icon}</div>
            <h2 className="text-2xl font-bold mb-2">{module.title}</h2>
            <p className="text-white/90">{module.description}</p>
          </Link>
        ))}
      </div>

      {/* Estadísticas rápidas (placeholder) */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Total Donadoras
          </h3>
          <p className="text-4xl font-bold text-primary">-</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Sesiones OPU (Este mes)
          </h3>
          <p className="text-4xl font-bold text-blue-500">-</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Tasa de Preñez
          </h3>
          <p className="text-4xl font-bold text-teal-500">-%</p>
        </div>
      </div>
    </div>
  )
}
