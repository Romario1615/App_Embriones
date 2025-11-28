import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, User, Thermometer, Clock, Beaker, Award, TrendingUp } from 'lucide-react'
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme, VictoryPie, VictoryLine, VictoryArea, VictoryScatter, VictoryTooltip } from 'victory'
import fecundacionService from '../services/fecundacionService'
import donadoraService from '../services/donadoraService'

export default function FecundacionDetail() {
  const { fecha, laboratorista } = useParams()
  const navigate = useNavigate()
  const [registros, setRegistros] = useState([])
  const [donadoras, setDonadoras] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [donadorasResponse, todosRegistros] = await Promise.all([
          donadoraService.getAll({ limit: 1000 }),
          fecundacionService.getAll()
        ])

        const donadorasList = donadorasResponse.donadoras || []
        setDonadoras(donadorasList)

        // Filtrar registros por fecha y laboratorista
        const filtrados = (todosRegistros || []).filter(r => {
          const fechaMatch = r.fecha_inicio_maduracion === fecha
          const labMatch = r.laboratorista === decodeURIComponent(laboratorista)
          return fechaMatch && labMatch
        })

        // Mapear donadoras a registros
        const mappedRegistros = filtrados.map(reg => {
          const donadora = donadorasList.find(d => d.id === reg.donadora_id)
          return { ...reg, donadora: donadora || null }
        })

        setRegistros(mappedRegistros)
      } catch (error) {
        console.error(error)
        alert('No se pudo cargar la sesión')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [fecha, laboratorista])

  const stats = useMemo(() => {
    if (!registros.length) return null

    const totalRegistros = registros.length
    const temperaturas = registros.filter(r => r.temperatura != null).map(r => r.temperatura)
    const temperaturaPromedio = temperaturas.length > 0
      ? (temperaturas.reduce((sum, t) => sum + t, 0) / temperaturas.length).toFixed(1)
      : 0

    const conFertilizacion = registros.filter(r => r.fecha_fertilizacion).length
    const tasaFertilizacion = totalRegistros > 0 ? ((conFertilizacion / totalRegistros) * 100).toFixed(1) : 0

    // Medios más utilizados
    const mediosMaduracion = {}
    const mediosFertilizacion = {}
    registros.forEach(r => {
      if (r.medio_maduracion) {
        mediosMaduracion[r.medio_maduracion] = (mediosMaduracion[r.medio_maduracion] || 0) + 1
      }
      if (r.medio_fertilizacion) {
        mediosFertilizacion[r.medio_fertilizacion] = (mediosFertilizacion[r.medio_fertilizacion] || 0) + 1
      }
    })

    const medioMaduracionMasUsado = Object.keys(mediosMaduracion).length > 0
      ? Object.entries(mediosMaduracion).sort((a, b) => b[1] - a[1])[0][0]
      : 'N/A'

    const medioFertilizacionMasUsado = Object.keys(mediosFertilizacion).length > 0
      ? Object.entries(mediosFertilizacion).sort((a, b) => b[1] - a[1])[0][0]
      : 'N/A'

    // Top 3 donadoras
    const topDonadoras = registros
      .filter(r => r.donadora)
      .slice(0, 3)
      .map(r => ({
        nombre: r.donadora.nombre || `Donadora ${r.donadora_id}`,
        registro: r.donadora.numero_registro || '-',
        temperatura: r.temperatura || 0,
        tiempoMaduracion: r.tiempo_maduracion || '-'
      }))

    // Datos para gráficos
    const temperaturaData = registros
      .filter(r => r.temperatura != null)
      .map((r, idx) => ({
        x: idx + 1,
        y: r.temperatura,
        label: r.donadora?.nombre || `Registro ${idx + 1}`
      }))

    const mediosMaduracionData = Object.entries(mediosMaduracion).map(([medio, count]) => ({
      x: medio,
      y: count
    }))

    const mediosFertilizacionData = Object.entries(mediosFertilizacion).map(([medio, count]) => ({
      x: medio,
      y: count
    }))

    // Timeline de fertilización
    const timelineData = registros
      .filter(r => r.fecha_fertilizacion)
      .sort((a, b) => new Date(a.fecha_fertilizacion) - new Date(b.fecha_fertilizacion))
      .map((r, idx) => ({
        x: idx + 1,
        y: 1,
        label: new Date(r.fecha_fertilizacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        donadora: r.donadora?.nombre || 'Sin nombre'
      }))

    return {
      totalRegistros,
      temperaturaPromedio,
      conFertilizacion,
      tasaFertilizacion,
      medioMaduracionMasUsado,
      medioFertilizacionMasUsado,
      topDonadoras,
      temperaturaData,
      mediosMaduracionData,
      mediosFertilizacionData,
      timelineData
    }
  }, [registros])

  if (loading) {
    return <p className="text-gray-600">Cargando...</p>
  }

  if (!registros.length) {
    return (
      <div>
        <button onClick={() => navigate('/fecundacion')} className="flex items-center text-gray-600 hover:text-gray-800 mb-4">
          <ArrowLeft size={18} className="mr-2" /> Volver
        </button>
        <p className="text-gray-600">No se encontraron registros para esta sesión</p>
      </div>
    )
  }

  const primerRegistro = registros[0]

  return (
    <div className="space-y-4 animate-fade-in">
      <button
        onClick={() => navigate('/fecundacion')}
        className="flex items-center text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft size={18} className="mr-2" /> Volver al listado
      </button>

      <div className="card shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/40 border-2 border-purple-100">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gradient-to-r from-purple-200 to-pink-200">
          <div className="bg-gradient-to-br from-purple-600 to-pink-700 p-3 rounded-xl shadow-lg">
            <span className="text-3xl">🧬</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 via-pink-700 to-fuchsia-700 bg-clip-text text-transparent">
              Sesión de Fecundación
            </h1>
            <p className="text-sm text-gray-600 mt-0.5">Detalles de la sesión IVF</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-3.5 border border-purple-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
            <p className="text-xs font-semibold text-purple-700 mb-1.5 uppercase tracking-wide">Fecha de inicio</p>
            <div className="flex items-center gap-2.5">
              <div className="bg-purple-600 p-2 rounded-lg shadow-sm">
                <Calendar size={18} className="text-white" />
              </div>
              <span className="text-base font-bold text-gray-900">
                {new Date(primerRegistro.fecha_inicio_maduracion).toLocaleDateString('es-ES', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-xl p-3.5 border border-pink-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
            <p className="text-xs font-semibold text-pink-700 mb-1.5 uppercase tracking-wide">Laboratorista</p>
            <div className="flex items-center gap-2.5">
              <div className="bg-pink-600 p-2 rounded-lg shadow-sm">
                <User size={18} className="text-white" />
              </div>
              <span className="text-base font-bold text-gray-900">{primerRegistro.laboratorista}</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3.5 border border-blue-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
            <p className="text-xs font-semibold text-blue-700 mb-1.5 uppercase tracking-wide">Medio de maduración</p>
            <div className="flex items-center gap-2.5">
              <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
                <Beaker size={18} className="text-white" />
              </div>
              <span className="text-base font-bold text-gray-900">{stats.medioMaduracionMasUsado}</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-3.5 border border-emerald-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
            <p className="text-xs font-semibold text-emerald-700 mb-1.5 uppercase tracking-wide">Medio de fertilización</p>
            <div className="flex items-center gap-2.5">
              <div className="bg-emerald-600 p-2 rounded-lg shadow-sm">
                <Beaker size={18} className="text-white" />
              </div>
              <span className="text-base font-bold text-gray-900">{stats.medioFertilizacionMasUsado}</span>
            </div>
          </div>
        </div>
      </div>

      {stats && (
        <>
          {/* KPIs Cards - 3 columnas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <Beaker className="text-purple-600" size={24} />
                <p className="text-4xl font-bold text-purple-900">{stats.totalRegistros}</p>
              </div>
              <p className="text-sm font-medium text-purple-800">Total Registros</p>
              <p className="text-xs text-purple-600 mt-1">Ovocitos procesados</p>
            </div>

            <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <div className="flex items-center justify-between mb-2">
                <Thermometer className="text-red-600" size={24} />
                <p className="text-4xl font-bold text-red-900">{stats.temperaturaPromedio}°C</p>
              </div>
              <p className="text-sm font-medium text-red-800">Temperatura Promedio</p>
              <p className="text-xs text-red-600 mt-1">Durante maduración</p>
            </div>

            <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="text-green-600" size={24} />
                <p className="text-4xl font-bold text-green-900">{stats.tasaFertilizacion}%</p>
              </div>
              <p className="text-sm font-medium text-green-800">Tasa Fertilización</p>
              <p className="text-xs text-green-600 mt-1">{stats.conFertilizacion} de {stats.totalRegistros} procesados</p>
            </div>
          </div>

          {/* Top 3 Donadoras */}
          {stats.topDonadoras.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                Donadoras Procesadas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.topDonadoras.map((d, idx) => (
                  <div
                    key={idx}
                    className={`border-2 rounded-xl p-4 transition-all hover:shadow-lg ${
                      idx === 0 ? 'border-yellow-400 bg-yellow-50' :
                      idx === 1 ? 'border-gray-400 bg-gray-50' :
                      'border-orange-400 bg-orange-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                      </span>
                      <span className="text-lg font-bold text-gray-800">{d.temperatura}°C</span>
                    </div>
                    <p className="text-gray-900 font-semibold text-sm mb-2 line-clamp-2">{d.nombre}</p>
                    <div className="flex gap-2 text-xs flex-wrap">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">Reg: {d.registro}</span>
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded font-medium">T: {d.tiempoMaduracion}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gráfico de Temperaturas */}
            {stats.temperaturaData.length > 0 && (
              <div className="card shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-white to-red-50/30">
                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <span className="text-2xl">🌡️</span>
                  <span className="bg-gradient-to-r from-red-600 to-orange-700 bg-clip-text text-transparent">Temperaturas de Maduración</span>
                </h3>
                <p className="text-xs text-gray-600 mb-2">
                  Registro de temperaturas durante el proceso ({stats.temperaturaData.length} mediciones)
                </p>
                <div className="bg-white rounded-xl p-2 shadow-inner">
                  <VictoryChart
                    theme={VictoryTheme.material}
                    height={220}
                    padding={{ top: 20, bottom: 45, left: 50, right: 30 }}
                  >
                    <VictoryAxis
                      tickFormat={(t) => `#${t}`}
                      style={{
                        tickLabels: { fontSize: 9, padding: 5, fontWeight: '600', fill: '#1f2937' },
                        axis: { stroke: '#94a3b8', strokeWidth: 1.5 }
                      }}
                    />
                    <VictoryAxis
                      dependentAxis
                      tickFormat={(x) => `${x}°C`}
                      style={{
                        tickLabels: { fontSize: 9, padding: 5, fontWeight: '600', fill: '#1f2937' },
                        axis: { stroke: '#94a3b8', strokeWidth: 1.5 },
                        grid: { stroke: '#e2e8f0', strokeWidth: 0.5, strokeDasharray: '4,4' }
                      }}
                    />
                    <VictoryArea
                      data={stats.temperaturaData}
                      style={{
                        data: { fill: 'url(#redGradient)', fillOpacity: 0.4 }
                      }}
                    />
                    <VictoryLine
                      data={stats.temperaturaData}
                      style={{
                        data: { stroke: '#ef4444', strokeWidth: 3 }
                      }}
                    />
                    <VictoryScatter
                      data={stats.temperaturaData}
                      size={5}
                      style={{
                        data: { fill: '#dc2626', stroke: '#ffffff', strokeWidth: 2 }
                      }}
                      labels={({ datum }) => `${datum.y}°C`}
                      labelComponent={
                        <VictoryTooltip
                          active={false}
                          style={{ fontSize: 9, fontWeight: 'bold', fill: '#ffffff' }}
                          flyoutStyle={{
                            fill: '#dc2626',
                            stroke: '#ef4444',
                            strokeWidth: 2
                          }}
                        />
                      }
                    />
                    <defs>
                      <linearGradient id="redGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#fca5a5" stopOpacity="0.2" />
                      </linearGradient>
                    </defs>
                  </VictoryChart>
                </div>
                <div className="p-2.5 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border-l-4 border-red-500 shadow-sm mt-2">
                  <p className="text-xs text-red-900 font-medium">
                    💡 Temperatura promedio: {stats.temperaturaPromedio}°C
                  </p>
                </div>
              </div>
            )}

            {/* Gráfico de Medios de Maduración */}
            {stats.mediosMaduracionData.length > 0 && (
              <div className="card shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-white to-blue-50/30">
                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <span className="text-2xl">🧪</span>
                  <span className="bg-gradient-to-r from-blue-600 to-cyan-700 bg-clip-text text-transparent">Medios de Maduración</span>
                </h3>
                <p className="text-xs text-gray-600 mb-2">
                  Distribución de medios utilizados en maduración
                </p>
                <div className="bg-white rounded-xl p-2 shadow-inner">
                  <VictoryChart
                    theme={VictoryTheme.material}
                    domainPadding={20}
                    height={220}
                    padding={{ top: 20, bottom: 60, left: 50, right: 30 }}
                  >
                    <VictoryAxis
                      style={{
                        tickLabels: { fontSize: 8, padding: 5, fontWeight: '600', fill: '#1f2937', angle: -20 },
                        axis: { stroke: '#94a3b8', strokeWidth: 1.5 }
                      }}
                    />
                    <VictoryAxis
                      dependentAxis
                      style={{
                        tickLabels: { fontSize: 9, padding: 5, fontWeight: '600', fill: '#1f2937' },
                        axis: { stroke: '#94a3b8', strokeWidth: 1.5 },
                        grid: { stroke: '#e2e8f0', strokeWidth: 0.5, strokeDasharray: '4,4' }
                      }}
                    />
                    <VictoryBar
                      data={stats.mediosMaduracionData}
                      cornerRadius={{ top: 8, bottom: 2 }}
                      style={{
                        data: { fill: '#3b82f6', fillOpacity: 0.9 }
                      }}
                      labels={({ datum }) => datum.y}
                      labelComponent={
                        <VictoryTooltip
                          style={{ fontSize: 9, fontWeight: 'bold', fill: '#ffffff' }}
                          flyoutStyle={{ fill: '#1e3a8a', stroke: '#3b82f6', strokeWidth: 2 }}
                        />
                      }
                    />
                  </VictoryChart>
                </div>
                <div className="p-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border-l-4 border-blue-500 shadow-sm mt-2">
                  <p className="text-xs text-blue-900 font-medium">
                    💡 Medio más usado: {stats.medioMaduracionMasUsado}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Tabla de registros */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Registros de la sesión</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Donadora</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Hora inicio</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Temp</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Tiempo mad.</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Fertilización</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Semen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {registros.map((reg) => (
                    <tr key={reg.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        {reg.donadora?.nombre || (reg.donadora_id ? `Donadora ${reg.donadora_id}` : '—')}
                      </td>
                      <td className="px-3 py-2">{reg.hora_inicio_maduracion || '—'}</td>
                      <td className="px-3 py-2">{reg.temperatura ? `${reg.temperatura}°C` : '—'}</td>
                      <td className="px-3 py-2">{reg.tiempo_maduracion || '—'}</td>
                      <td className="px-3 py-2">
                        {reg.fecha_fertilizacion
                          ? new Date(reg.fecha_fertilizacion).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-3 py-2">{reg.semen_utilizado || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
