/**
 * Componente de estadísticas para donadoras
 */
import { TrendingUp, Users, Beef, Milk } from 'lucide-react'

export default function DonadoraStats({ statistics }) {
  if (!statistics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card animate-pulse">
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
        <div className="card animate-pulse">
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
        <div className="card animate-pulse">
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
        <div className="card animate-pulse">
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const { total_activas, total_inactivas, por_raza, por_tipo_ganado, por_propietario } = statistics

  return (
    <div className="space-y-6 mb-6">
      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Activas */}
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Donadoras Activas</p>
              <p className="text-3xl font-bold text-green-700 mt-1">{total_activas}</p>
            </div>
            <div className="p-3 bg-green-500 rounded-full">
              <TrendingUp className="text-white" size={24} />
            </div>
          </div>
        </div>

        {/* Total Inactivas */}
        <div className="card bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Donadoras Inactivas</p>
              <p className="text-3xl font-bold text-gray-700 mt-1">{total_inactivas}</p>
            </div>
            <div className="p-3 bg-gray-500 rounded-full">
              <Users className="text-white" size={24} />
            </div>
          </div>
        </div>

        {/* Ganado de Carne */}
        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Ganado de Carne</p>
              <p className="text-3xl font-bold text-red-700 mt-1">
                {por_tipo_ganado?.carne || 0}
              </p>
            </div>
            <div className="p-3 bg-red-500 rounded-full">
              <Beef className="text-white" size={24} />
            </div>
          </div>
        </div>

        {/* Ganado de Leche */}
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Ganado de Leche</p>
              <p className="text-3xl font-bold text-blue-700 mt-1">
                {por_tipo_ganado?.leche || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-500 rounded-full">
              <Milk className="text-white" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Distribución por Raza y Propietarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Distribución por Raza */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución por Raza</h3>
          {por_raza && Object.keys(por_raza).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(por_raza)
                .sort((a, b) => b[1] - a[1])
                .map(([raza, count]) => (
                  <div key={raza} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{raza}</span>
                        <span className="text-sm font-semibold text-gray-900">{count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{
                            width: `${(count / total_activas) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No hay datos disponibles</p>
          )}
        </div>

        {/* Top 10 Propietarios */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 10 Propietarios</h3>
          {por_propietario && por_propietario.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {por_propietario.map((propietario, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                        {propietario.nombre}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 ml-2">
                        {propietario.count}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-secondary h-2 rounded-full transition-all"
                        style={{
                          width: `${(propietario.count / total_activas) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No hay datos disponibles</p>
          )}
        </div>
      </div>
    </div>
  )
}
