import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, User, Target, TrendingUp, Award } from 'lucide-react'
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme, VictoryPie, VictoryLabel } from 'victory'
import transferenciaService from '../services/transferenciaService'
import donadoraService from '../services/donadoraService'

export default function TransferenciaDetail() {
  const { fecha } = useParams()
  const navigate = useNavigate()
  const [transferencias, setTransferencias] = useState([])
  const [donadoras, setDonadoras] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [donadorasData, todasTransferencias] = await Promise.all([
          donadoraService.getAll(),
          transferenciaService.getAll()
        ])

        setDonadoras(donadorasData || [])

        // Filtrar transferencias por fecha de creación
        const filtradas = (todasTransferencias || []).filter(t => {
          const fechaCreacion = new Date(t.fecha_creacion).toISOString().split('T')[0]
          return fechaCreacion === fecha
        })

        // Mapear donadoras a transferencias
        const mappedTransferencias = filtradas.map(trans => {
          const donadora = (donadorasData || []).find(d => d.id === trans.donadora_id)
          return { ...trans, donadora: donadora || null }
        })

        setTransferencias(mappedTransferencias)
      } catch (error) {
        console.error(error)
        alert('No se pudo cargar la sesión')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [fecha])

  const stats = useMemo(() => {
    if (!transferencias.length) return null

    const totalTransferencias = transferencias.length

    // Estadios
    const estadios = {}
    transferencias.forEach(t => {
      if (t.estadio) {
        estadios[t.estadio] = (estadios[t.estadio] || 0) + 1
      }
    })

    const estadioMasComun = Object.keys(estadios).length > 0
      ? Object.entries(estadios).sort((a, b) => b[1] - a[1])[0][0]
      : 'N/A'

    // Receptoras únicas
    const receptorasUnicas = new Set(transferencias.filter(t => t.receptora).map(t => t.receptora)).size

    // Donadoras únicas
    const donadorasUnicas = new Set(transferencias.filter(t => t.donadora_id).map(t => t.donadora_id)).size

    // Toros
    const toros = {}
    transferencias.forEach(t => {
      if (t.toro) {
        toros[t.toro] = (toros[t.toro] || 0) + 1
      }
    })

    const toroMasUsado = Object.keys(toros).length > 0
      ? Object.entries(toros).sort((a, b) => b[1] - a[1])[0][0]
      : 'N/A'

    // Top 3 donadoras por cantidad de transferencias
    const donadorasCounts = {}
    transferencias.forEach(t => {
      if (t.donadora) {
        const key = t.donadora.id
        if (!donadorasCounts[key]) {
          donadorasCounts[key] = {
            nombre: t.donadora.nombre,
            registro: t.donadora.numero_registro,
            count: 0
          }
        }
        donadorasCounts[key].count++
      }
    })

    const topDonadoras = Object.values(donadorasCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    // Datos para gráficos
    const estadiosData = Object.entries(estadios).map(([estadio, count]) => ({
      x: estadio,
      y: count
    }))

    const torosData = Object.entries(toros)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([toro, count]) => ({
        x: toro,
        y: count
      }))

    // Distribución ciclado (izquierdo vs derecho)
    const conCicladoIzquierdo = transferencias.filter(t => t.ciclado_izquierdo).length
    const conCicladoDerecho = transferencias.filter(t => t.ciclado_derecho).length
    const cicladoData = []
    if (conCicladoIzquierdo > 0) cicladoData.push({ x: 'Izquierdo', y: conCicladoIzquierdo })
    if (conCicladoDerecho > 0) cicladoData.push({ x: 'Derecho', y: conCicladoDerecho })

    return {
      totalTransferencias,
      estadioMasComun,
      receptorasUnicas,
      donadorasUnicas,
      toroMasUsado,
      topDonadoras,
      estadiosData,
      torosData,
      cicladoData
    }
  }, [transferencias])

  if (loading) {
    return <p className="text-gray-600">Cargando...</p>
  }

  if (!transferencias.length) {
    return (
      <div>
        <button onClick={() => navigate('/transferencia')} className="flex items-center text-gray-600 hover:text-gray-800 mb-4">
          <ArrowLeft size={18} className="mr-2" /> Volver
        </button>
        <p className="text-gray-600">No se encontraron transferencias para esta fecha</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate('/transferencia')}
        className="flex items-center text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft size={18} className="mr-2" /> Volver al listado
      </button>

      <div className="card shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white via-teal-50/30 to-cyan-50/40 border-2 border-teal-100">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gradient-to-r from-teal-200 to-cyan-200">
          <div className="bg-gradient-to-br from-teal-600 to-cyan-700 p-3 rounded-xl shadow-lg">
            <span className="text-3xl">🦠</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-700 via-cyan-700 to-blue-700 bg-clip-text text-transparent">
              Sesión de Transferencia
            </h1>
            <p className="text-sm text-gray-600 mt-0.5">Detalles de transferencias de embriones</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-xl p-3.5 border border-teal-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
            <p className="text-xs font-semibold text-teal-700 mb-1.5 uppercase tracking-wide">Fecha de sesión</p>
            <div className="flex items-center gap-2.5">
              <div className="bg-teal-600 p-2 rounded-lg shadow-sm">
                <Calendar size={18} className="text-white" />
              </div>
              <span className="text-base font-bold text-gray-900">
                {new Date(fecha).toLocaleDateString('es-ES', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 rounded-xl p-3.5 border border-cyan-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
            <p className="text-xs font-semibold text-cyan-700 mb-1.5 uppercase tracking-wide">Estadio más común</p>
            <div className="flex items-center gap-2.5">
              <div className="bg-cyan-600 p-2 rounded-lg shadow-sm">
                <Target size={18} className="text-white" />
              </div>
              <span className="text-base font-bold text-gray-900">{stats?.estadioMasComun}</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3.5 border border-blue-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
            <p className="text-xs font-semibold text-blue-700 mb-1.5 uppercase tracking-wide">Toro más usado</p>
            <div className="flex items-center gap-2.5">
              <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
                <span className="text-white text-lg">🐂</span>
              </div>
              <span className="text-base font-bold text-gray-900">{stats?.toroMasUsado}</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-3.5 border border-emerald-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
            <p className="text-xs font-semibold text-emerald-700 mb-1.5 uppercase tracking-wide">Receptoras únicas</p>
            <div className="flex items-center gap-2.5">
              <div className="bg-emerald-600 p-2 rounded-lg shadow-sm">
                <span className="text-white text-lg">🐄</span>
              </div>
              <span className="text-base font-bold text-gray-900">{stats?.receptorasUnicas}</span>
            </div>
          </div>
        </div>
      </div>

      {stats && (
        <>
          {/* KPIs Cards - 3 columnas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
              <div className="flex items-center justify-between mb-2">
                <Target className="text-teal-600" size={24} />
                <p className="text-4xl font-bold text-teal-900">{stats.totalTransferencias}</p>
              </div>
              <p className="text-sm font-medium text-teal-800">Total Transferencias</p>
              <p className="text-xs text-teal-600 mt-1">Embriones transferidos</p>
            </div>

            <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <Award className="text-purple-600" size={24} />
                <p className="text-4xl font-bold text-purple-900">{stats.donadorasUnicas}</p>
              </div>
              <p className="text-sm font-medium text-purple-800">Donadoras Distintas</p>
              <p className="text-xs text-purple-600 mt-1">Variedad genética</p>
            </div>

            <div className="card bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="text-cyan-600" size={24} />
                <p className="text-4xl font-bold text-cyan-900">{stats.receptorasUnicas}</p>
              </div>
              <p className="text-sm font-medium text-cyan-800">Receptoras Distintas</p>
              <p className="text-xs text-cyan-600 mt-1">Animales receptores</p>
            </div>
          </div>

          {/* Top 3 Donadoras */}
          {stats.topDonadoras.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                Top 3 Donadoras Utilizadas
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
                      <span className="text-2xl font-bold text-gray-800">{d.count}</span>
                    </div>
                    <p className="text-gray-900 font-semibold text-sm mb-2 line-clamp-2">{d.nombre}</p>
                    <div className="flex gap-2 text-xs flex-wrap">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">Reg: {d.registro}</span>
                      <span className="bg-teal-100 text-teal-800 px-2 py-1 rounded font-medium">{d.count} transferencias</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gráfico de Estadios */}
            {stats.estadiosData.length > 0 && (
              <div className="card shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-white to-teal-50/30">
                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  <span className="bg-gradient-to-r from-teal-600 to-cyan-700 bg-clip-text text-transparent">Distribución por Estadio</span>
                </h3>
                <p className="text-xs text-gray-600 mb-2">
                  Estadios embrionarios utilizados ({stats.estadiosData.length} tipos)
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
                        tickLabels: { fontSize: 9, padding: 5, fontWeight: '600', fill: '#1f2937', angle: -20 },
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
                      data={stats.estadiosData}
                      cornerRadius={{ top: 8, bottom: 2 }}
                      style={{
                        data: { fill: '#14b8a6', fillOpacity: 0.9 }
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
                <div className="p-2.5 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border-l-4 border-teal-500 shadow-sm mt-2">
                  <p className="text-xs text-teal-900 font-medium">
                    💡 Estadio más común: {stats.estadioMasComun}
                  </p>
                </div>
              </div>
            )}

            {/* Gráfico de Toros */}
            {stats.torosData.length > 0 && (
              <div className="card shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-white to-blue-50/30">
                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <span className="text-2xl">🐂</span>
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">Top 5 Toros Utilizados</span>
                </h3>
                <p className="text-xs text-gray-600 mb-2">
                  Toros más utilizados en las transferencias
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
                      data={stats.torosData}
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
                    💡 Toro más usado: {stats.toroMasUsado}
                  </p>
                </div>
              </div>
            )}

            {/* Gráfico de Ciclado */}
            {stats.cicladoData.length > 0 && (
              <div className="card shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-white to-purple-50/30">
                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <span className="text-2xl">🎯</span>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Distribución de Ciclado</span>
                </h3>
                <p className="text-xs text-gray-600 mb-2">
                  Lado de ciclado en las transferencias
                </p>
                <div className="bg-white rounded-xl p-2 shadow-inner flex items-center justify-center">
                  <VictoryPie
                    data={stats.cicladoData}
                    colorScale={['#8b5cf6', '#ec4899']}
                    labels={({ datum }) => `${datum.x}\n${datum.y}`}
                    height={220}
                    innerRadius={40}
                    padAngle={3}
                    style={{
                      data: { fillOpacity: 0.95, strokeWidth: 2, stroke: '#ffffff' },
                      labels: { fontSize: 10, fill: '#ffffff', fontWeight: 'bold' }
                    }}
                  />
                </div>
                <div className="mt-3 space-y-2">
                  {stats.cicladoData.map((item, idx) => {
                    const colors = ['#8b5cf6', '#ec4899']
                    const total = stats.cicladoData.reduce((sum, d) => sum + d.y, 0)
                    const percentage = ((item.y / total) * 100).toFixed(1)
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
              </div>
            )}
          </div>

          {/* Tabla de transferencias */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Transferencias de la sesión</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">N°</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Donadora</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Toro</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Estadio</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Receptora</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Ciclado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transferencias.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{t.numero_secuencial}</td>
                      <td className="px-3 py-2">
                        {t.donadora?.nombre || (t.donadora_id ? `Donadora ${t.donadora_id}` : '—')}
                      </td>
                      <td className="px-3 py-2">{t.toro || '—'}</td>
                      <td className="px-3 py-2">{t.estadio || '—'}</td>
                      <td className="px-3 py-2">{t.receptora || '—'}</td>
                      <td className="px-3 py-2">
                        {t.ciclado_izquierdo && t.ciclado_derecho
                          ? `I: ${t.ciclado_izquierdo}, D: ${t.ciclado_derecho}`
                          : t.ciclado_izquierdo
                          ? `Izq: ${t.ciclado_izquierdo}`
                          : t.ciclado_derecho
                          ? `Der: ${t.ciclado_derecho}`
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
