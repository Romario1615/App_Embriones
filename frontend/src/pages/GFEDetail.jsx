import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, User, Heart, TrendingUp, Award, Target } from 'lucide-react'
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme, VictoryPie, VictoryLabel } from 'victory'
import gfeService from '../services/gfeService'

export default function GFEDetail() {
  const { fecha, cliente } = useParams()
  const navigate = useNavigate()
  const [chequeos, setChequeos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const todosChequeos = await gfeService.getAll()

        // Filtrar chequeos por fecha y cliente
        const filtrados = (todosChequeos || []).filter(c => {
          const fechaMatch = c.fecha === fecha
          const clienteMatch = c.cliente === decodeURIComponent(cliente)
          return fechaMatch && clienteMatch
        })

        setChequeos(filtrados)
      } catch (error) {
        console.error(error)
        alert('No se pudo cargar la sesión')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [fecha, cliente])

  const stats = useMemo(() => {
    if (!chequeos.length) return null

    const totalChequeos = chequeos.length
    const prenadas = chequeos.filter(c => c.estado === 'prenada').length
    const vacias = chequeos.filter(c => c.estado === 'vacia').length
    const tasaExito = totalChequeos > 0 ? ((prenadas / totalChequeos) * 100).toFixed(1) : 0

    // Técnicos
    const tecnicos = {}
    chequeos.forEach(c => {
      if (c.tecnico_chequeo) {
        tecnicos[c.tecnico_chequeo] = (tecnicos[c.tecnico_chequeo] || 0) + 1
      }
    })

    const tecnicoMasActivo = Object.keys(tecnicos).length > 0
      ? Object.entries(tecnicos).sort((a, b) => b[1] - a[1])[0][0]
      : 'N/A'

    // Haciendas
    const haciendas = {}
    chequeos.forEach(c => {
      if (c.hacienda) {
        haciendas[c.hacienda] = (haciendas[c.hacienda] || 0) + 1
      }
    })

    const haciendaMasComun = Object.keys(haciendas).length > 0
      ? Object.entries(haciendas).sort((a, b) => b[1] - a[1])[0][0]
      : 'N/A'

    // Receptoras únicas
    const receptorasUnicas = new Set(chequeos.filter(c => c.receptora).map(c => c.receptora)).size

    // Top 3 técnicos por cantidad de chequeos
    const tecnicosData = Object.entries(tecnicos)
      .map(([nombre, count]) => ({ nombre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    // Datos para gráficos
    const estadoData = [
      { x: 'Preñadas', y: prenadas, label: `${prenadas} (${((prenadas / totalChequeos) * 100).toFixed(1)}%)` },
      { x: 'Vacías', y: vacias, label: `${vacias} (${((vacias / totalChequeos) * 100).toFixed(1)}%)` }
    ].filter(d => d.y > 0)

    const tecnicosChartData = Object.entries(tecnicos)
      .sort((a, b) => b[1] - a[1])
      .map(([nombre, count]) => ({
        x: nombre,
        y: count
      }))

    const haciendasData = Object.entries(haciendas)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([hacienda, count]) => ({
        x: hacienda,
        y: count
      }))

    return {
      totalChequeos,
      prenadas,
      vacias,
      tasaExito,
      tecnicoMasActivo,
      haciendaMasComun,
      receptorasUnicas,
      tecnicosData,
      estadoData,
      tecnicosChartData,
      haciendasData
    }
  }, [chequeos])

  if (loading) {
    return <p className="text-gray-600">Cargando...</p>
  }

  if (!chequeos.length) {
    return (
      <div>
        <button onClick={() => navigate('/gfe')} className="flex items-center text-gray-600 hover:text-gray-800 mb-4">
          <ArrowLeft size={18} className="mr-2" /> Volver
        </button>
        <p className="text-gray-600">No se encontraron chequeos para esta sesión</p>
      </div>
    )
  }

  const primerChequeo = chequeos[0]

  return (
    <div className="space-y-4 animate-fade-in">
      <button
        onClick={() => navigate('/gfe')}
        className="flex items-center text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft size={18} className="mr-2" /> Volver al listado
      </button>

      <div className="card shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white via-pink-50/30 to-rose-50/40 border-2 border-pink-100">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gradient-to-r from-pink-200 to-rose-200">
          <div className="bg-gradient-to-br from-pink-600 to-rose-700 p-3 rounded-xl shadow-lg">
            <span className="text-3xl">💗</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-700 via-rose-700 to-red-700 bg-clip-text text-transparent">
              Sesión de Chequeo GFE
            </h1>
            <p className="text-sm text-gray-600 mt-0.5">Gestión de Folículos y Embriones</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-xl p-3.5 border border-pink-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
            <p className="text-xs font-semibold text-pink-700 mb-1.5 uppercase tracking-wide">Fecha de chequeo</p>
            <div className="flex items-center gap-2.5">
              <div className="bg-pink-600 p-2 rounded-lg shadow-sm">
                <Calendar size={18} className="text-white" />
              </div>
              <span className="text-base font-bold text-gray-900">
                {new Date(primerChequeo.fecha).toLocaleDateString('es-ES', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 rounded-xl p-3.5 border border-rose-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
            <p className="text-xs font-semibold text-rose-700 mb-1.5 uppercase tracking-wide">Cliente</p>
            <div className="flex items-center gap-2.5">
              <div className="bg-rose-600 p-2 rounded-lg shadow-sm">
                <User size={18} className="text-white" />
              </div>
              <span className="text-base font-bold text-gray-900">{primerChequeo.cliente}</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3.5 border border-blue-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
            <p className="text-xs font-semibold text-blue-700 mb-1.5 uppercase tracking-wide">Técnico más activo</p>
            <div className="flex items-center gap-2.5">
              <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
                <User size={18} className="text-white" />
              </div>
              <span className="text-base font-bold text-gray-900">{stats?.tecnicoMasActivo}</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-3.5 border border-emerald-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
            <p className="text-xs font-semibold text-emerald-700 mb-1.5 uppercase tracking-wide">Hacienda principal</p>
            <div className="flex items-center gap-2.5">
              <div className="bg-emerald-600 p-2 rounded-lg shadow-sm">
                <span className="text-white text-lg">🏡</span>
              </div>
              <span className="text-base font-bold text-gray-900">{stats?.haciendaMasComun}</span>
            </div>
          </div>
        </div>
      </div>

      {stats && (
        <>
          {/* KPIs Cards - 4 columnas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
              <div className="flex items-center justify-between mb-2">
                <Heart className="text-pink-600" size={24} />
                <p className="text-4xl font-bold text-pink-900">{stats.totalChequeos}</p>
              </div>
              <p className="text-sm font-medium text-pink-800">Total Chequeos</p>
              <p className="text-xs text-pink-600 mt-1">Realizados en sesión</p>
            </div>

            <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="flex items-center justify-between mb-2">
                <Award className="text-green-600" size={24} />
                <p className="text-4xl font-bold text-green-900">{stats.prenadas}</p>
              </div>
              <p className="text-sm font-medium text-green-800">Preñadas</p>
              <p className="text-xs text-green-600 mt-1">Gestaciones confirmadas</p>
            </div>

            <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <div className="flex items-center justify-between mb-2">
                <Target className="text-red-600" size={24} />
                <p className="text-4xl font-bold text-red-900">{stats.vacias}</p>
              </div>
              <p className="text-sm font-medium text-red-800">Vacías</p>
              <p className="text-xs text-red-600 mt-1">Sin gestación</p>
            </div>

            <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="text-purple-600" size={24} />
                <p className="text-4xl font-bold text-purple-900">{stats.tasaExito}%</p>
              </div>
              <p className="text-sm font-medium text-purple-800">Tasa de Éxito</p>
              <p className="text-xs text-purple-600 mt-1">Porcentaje de preñez</p>
            </div>
          </div>

          {/* Top 3 Técnicos */}
          {stats.tecnicosData.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">👨‍⚕️</span>
                Técnicos de la Sesión
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.tecnicosData.map((t, idx) => (
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
                      <span className="text-2xl font-bold text-gray-800">{t.count}</span>
                    </div>
                    <p className="text-gray-900 font-semibold text-sm mb-2 line-clamp-2">{t.nombre}</p>
                    <div className="flex gap-2 text-xs flex-wrap">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">{t.count} chequeos</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gráfico de Estado (Preñadas vs Vacías) */}
            {stats.estadoData.length > 0 && (
              <div className="card shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-white to-pink-50/30">
                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <span className="text-2xl">💖</span>
                  <span className="bg-gradient-to-r from-pink-600 to-rose-700 bg-clip-text text-transparent">Estado de Gestación</span>
                </h3>
                <p className="text-xs text-gray-600 mb-2">
                  Distribución de preñadas vs vacías ({stats.totalChequeos} chequeos)
                </p>
                <div className="bg-white rounded-xl p-2 shadow-inner flex items-center justify-center">
                  <VictoryPie
                    data={stats.estadoData}
                    colorScale={['#22c55e', '#ef4444']}
                    labels={({ datum }) => datum.label}
                    height={220}
                    innerRadius={40}
                    padAngle={3}
                    style={{
                      data: { fillOpacity: 0.95, strokeWidth: 2, stroke: '#ffffff' },
                      labels: { fontSize: 9, fill: '#ffffff', fontWeight: 'bold' }
                    }}
                  />
                </div>
                <div className="mt-3 space-y-2">
                  {stats.estadoData.map((item, idx) => {
                    const colors = ['#22c55e', '#ef4444']
                    const percentage = ((item.y / stats.totalChequeos) * 100).toFixed(1)
                    return (
                      <div key={idx} className="flex items-center justify-between bg-white/70 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-4 h-4 rounded-full shadow-md" style={{ backgroundColor: colors[idx] }} />
                          <span className="text-sm font-semibold text-gray-800">{item.x}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-900">{item.y}</span>
                          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="p-2.5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-l-4 border-green-500 shadow-sm mt-2">
                  <p className="text-xs text-green-900 font-medium">
                    💡 Tasa de éxito: {stats.tasaExito}% de preñez
                  </p>
                </div>
              </div>
            )}

            {/* Gráfico de Técnicos */}
            {stats.tecnicosChartData.length > 0 && (
              <div className="card shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-white to-blue-50/30">
                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <span className="text-2xl">👨‍⚕️</span>
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">Chequeos por Técnico</span>
                </h3>
                <p className="text-xs text-gray-600 mb-2">
                  Distribución de chequeos entre técnicos
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
                        tickLabels: { fontSize: 8, padding: 5, fontWeight: '600', fill: '#1f2937', angle: -30 },
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
                      data={stats.tecnicosChartData}
                      cornerRadius={{ top: 8, bottom: 2 }}
                      style={{
                        data: { fill: '#3b82f6', fillOpacity: 0.9 }
                      }}
                      labels={({ datum }) => datum.y}
                      labelComponent={
                        <VictoryLabel
                          dy={-8}
                          style={{ fontSize: 10, fill: '#0f172a', fontWeight: 'bold' }}
                        />
                      }
                    />
                  </VictoryChart>
                </div>
                <div className="p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500 shadow-sm mt-2">
                  <p className="text-xs text-blue-900 font-medium">
                    💡 Técnico más activo: {stats.tecnicoMasActivo}
                  </p>
                </div>
              </div>
            )}

            {/* Gráfico de Haciendas */}
            {stats.haciendasData.length > 0 && (
              <div className="card shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-white to-emerald-50/30">
                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <span className="text-2xl">🏡</span>
                  <span className="bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">Top 5 Haciendas</span>
                </h3>
                <p className="text-xs text-gray-600 mb-2">
                  Haciendas con más chequeos realizados
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
                        tickLabels: { fontSize: 8, padding: 5, fontWeight: '600', fill: '#1f2937', angle: -30 },
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
                      data={stats.haciendasData}
                      cornerRadius={{ top: 8, bottom: 2 }}
                      style={{
                        data: { fill: '#10b981', fillOpacity: 0.9 }
                      }}
                      labels={({ datum }) => datum.y}
                      labelComponent={
                        <VictoryLabel
                          dy={-8}
                          style={{ fontSize: 10, fill: '#0f172a', fontWeight: 'bold' }}
                        />
                      }
                    />
                  </VictoryChart>
                </div>
                <div className="p-2.5 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border-l-4 border-emerald-500 shadow-sm mt-2">
                  <p className="text-xs text-emerald-900 font-medium">
                    💡 Hacienda principal: {stats.haciendaMasComun}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Tabla de chequeos */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Chequeos de la sesión</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Receptora</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Técnico</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Hacienda</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {chequeos.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{c.receptora}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          c.estado === 'prenada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {c.estado === 'prenada' ? '✓ Preñada' : '✗ Vacía'}
                        </span>
                      </td>
                      <td className="px-3 py-2">{c.tecnico_chequeo}</td>
                      <td className="px-3 py-2">{c.hacienda || '—'}</td>
                      <td className="px-3 py-2">
                        {c.hora_inicio || c.hora_final
                          ? `${c.hora_inicio || '—'} - ${c.hora_final || '—'}`
                          : '—'}
                      </td>
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
