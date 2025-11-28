import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, User, TrendingUp, Award, Target } from 'lucide-react'
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme, VictoryPie, VictoryLine, VictoryArea, VictoryTooltip, VictoryStack, VictoryLabel, VictoryScatter } from 'victory'
import opuService from '../services/opuService'
import donadoraService from '../services/donadoraService'

const calcTotalViables = (ext) =>
  (Number(ext.grado_1) || 0) +
  (Number(ext.grado_2) || 0) +
  (Number(ext.grado_3) || 0) +
  (Number(ext.desnudos) || 0)

const getDonadoraLabel = (ext) => {
  if (ext?.donadora?.nombre) return ext.donadora.nombre
  if (ext?.donadora_id) return `Donadora ${ext.donadora_id}`
  return 'Nueva donadora'
}

export default function OPUDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [sesion, setSesion] = useState(null)
  const [donadoras, setDonadoras] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        // Cargar donadoras y sesión en paralelo
        const [donadorasResponse, sesionData] = await Promise.all([
          donadoraService.getAll({ limit: 1000 }),
          opuService.getById(id)
        ])

        const donadorasList = donadorasResponse.donadoras || []
        setDonadoras(donadorasList)

        // Mapear las extracciones con los nombres de donadoras
        if (sesionData.extracciones || sesionData.extracciones_donadoras) {
          const extrList = sesionData.extracciones || sesionData.extracciones_donadoras
          const mappedExtr = extrList.map(ext => {
            const donadora = donadorasList.find(d => d.id === ext.donadora_id)
            return {
              ...ext,
              donadora: donadora || null
            }
          })

          sesionData.extracciones = mappedExtr
          sesionData.extracciones_donadoras = mappedExtr
        }

        setSesion(sesionData)
      } catch (error) {
        console.error(error)
        alert('No se pudo cargar la sesión')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const dash = useMemo(() => {
    const extr = sesion?.extracciones || sesion?.extracciones_donadoras || []
    if (!extr.length) return null

    const totalViables = extr.reduce((sum, e) => sum + calcTotalViables(e), 0)
    const totalIrregular = extr.reduce((sum, e) => sum + (Number(e.irregular) || 0), 0)
    const totalDesnudos = extr.reduce((sum, e) => sum + (Number(e.desnudos) || 0), 0)

    const gi = extr.reduce((s, e) => s + (Number(e.grado_1) || 0), 0)
    const gii = extr.reduce((s, e) => s + (Number(e.grado_2) || 0), 0)
    const giii = extr.reduce((s, e) => s + (Number(e.grado_3) || 0), 0)

    // Estadísticas adicionales
    const totalOvocitos = totalViables + totalIrregular
    const tasaViabilidad = totalOvocitos > 0 ? ((totalViables / totalOvocitos) * 100).toFixed(1) : 0
    const totalDonadoras = extr.length
    const promedioViablesPorDonadora = totalDonadoras > 0 ? (totalViables / totalDonadoras).toFixed(1) : 0
    const tasaGI = totalViables > 0 ? ((gi / totalViables) * 100).toFixed(1) : 0
    const tasaExcelencia = totalViables > 0 ? (((gi + gii) / totalViables) * 100).toFixed(1) : 0

    const bestBy = (key) => extr
      .map((e) => ({ ...e, _value: Number(e[key]) || 0 }))
      .sort((a, b) => b._value - a._value)[0]

    const bestGI = bestBy('grado_1')
    const bestGII = bestBy('grado_2')
    const bestGIII = bestBy('grado_3')

    const bestTotal = extr
      .map((e) => ({ ...e, _value: calcTotalViables(e) }))
      .sort((a, b) => b._value - a._value)[0]

    const byGrado = {
      GI: gi,
      GII: gii,
      GIII: giii,
      Desnudos: totalDesnudos,
      Irregular: totalIrregular
    }

    const topDonadoras = extr
      .map((e) => ({
        label: getDonadoraLabel(e),
        total: calcTotalViables(e),
        gi: Number(e.grado_1) || 0,
        gii: Number(e.grado_2) || 0,
        giii: Number(e.grado_3) || 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)

    // Datos para Victory - Gráfico de barras por grado
    const victoryBarData = [
      { grado: 'GI', cantidad: gi, fill: '#1d4ed8' },
      { grado: 'GII', cantidad: gii, fill: '#0ea5e9' },
      { grado: 'GIII', cantidad: giii, fill: '#22c55e' },
      { grado: 'Desnudos', cantidad: totalDesnudos, fill: '#f59e0b' },
      { grado: 'Irregular', cantidad: totalIrregular, fill: '#ef4444' }
    ]

    // Datos para Victory - Gráfico de pastel
    const victoryPieData = [
      { x: 'GI', y: gi, label: `GI\n${gi}` },
      { x: 'GII', y: gii, label: `GII\n${gii}` },
      { x: 'GIII', y: giii, label: `GIII\n${giii}` },
      { x: 'Desnudos', y: totalDesnudos, label: `Desnudos\n${totalDesnudos}` },
      { x: 'Irregular', y: totalIrregular, label: `Irregular\n${totalIrregular}` }
    ].filter(d => d.y > 0)

    // Datos para Victory - Top 3 Donadoras apiladas
    const victoryStackData = {
      gi: topDonadoras.map((d, i) => ({ x: i + 1, y: d.gi, label: d.label.split(' ')[0] })),
      gii: topDonadoras.map((d, i) => ({ x: i + 1, y: d.gii, label: d.label.split(' ')[0] })),
      giii: topDonadoras.map((d, i) => ({ x: i + 1, y: d.giii, label: d.label.split(' ')[0] }))
    }

    // Timeline (hora_extraccion) - para Victory
    const timelinePoints = extr
      .map((e, idx) => {
        const parts = (e.hora_extraccion || '').split(':')
        const minutes = parts.length === 2 ? Number(parts[0]) * 60 + Number(parts[1]) : idx * 5
        const hora = parts.length === 2 ? `${parts[0]}:${parts[1]}` : `${idx * 5}m`
        return { x: minutes, y: calcTotalViables(e), label: hora }
      })
      .sort((a, b) => a.x - b.x)

    const victoryTimelineData = timelinePoints.map((p, i) => ({
      x: i + 1,
      y: p.y,
      label: p.label
    }))

    return {
      totalViables,
      totalIrregular,
      totalDesnudos,
      totalOvocitos,
      tasaViabilidad,
      totalDonadoras,
      promedioViablesPorDonadora,
      tasaGI,
      tasaExcelencia,
      gi,
      gii,
      giii,
      bestGI,
      bestGII,
      bestGIII,
      bestTotal,
      byGrado,
      topDonadoras,
      victoryBarData,
      victoryPieData,
      victoryStackData,
      victoryTimelineData
    }
  }, [sesion])

  if (loading) {
    return <p className="text-gray-600">Cargando...</p>
  }

  if (!sesion) {
    return (
      <div>
        <p className="text-gray-600">Sesión no encontrada</p>
        <button onClick={() => navigate('/opu')} className="btn-primary mt-4">Volver</button>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <button
        onClick={() => navigate('/opu')}
        className="flex items-center text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft size={18} className="mr-2" /> Volver al listado
      </button>

      <div className="card shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 border-2 border-blue-100">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gradient-to-r from-blue-200 to-indigo-200">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-3 rounded-xl shadow-lg">
            <span className="text-3xl">📋</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent">
              Sesión OPU #{sesion.id}
            </h1>
            <p className="text-sm text-gray-600 mt-0.5">Información general de la sesión</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3.5 border border-blue-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
            <p className="text-xs font-semibold text-blue-700 mb-1.5 uppercase tracking-wide">Fecha</p>
            <div className="flex items-center gap-2.5">
              <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
                <Calendar size={18} className="text-white" />
              </div>
              <span className="text-base font-bold text-gray-900">{new Date(sesion.fecha).toLocaleDateString('es-ES', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-3.5 border border-purple-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
            <p className="text-xs font-semibold text-purple-700 mb-1.5 uppercase tracking-wide">Cliente</p>
            <div className="flex items-center gap-2.5">
              <div className="bg-purple-600 p-2 rounded-lg shadow-sm">
                <span className="text-white text-lg">🏢</span>
              </div>
              <span className="text-base font-bold text-gray-900">{sesion.cliente}</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-3.5 border border-emerald-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
            <p className="text-xs font-semibold text-emerald-700 mb-1.5 uppercase tracking-wide">Técnico OPU</p>
            <div className="flex items-center gap-2.5">
              <div className="bg-emerald-600 p-2 rounded-lg shadow-sm">
                <User size={18} className="text-white" />
              </div>
              <span className="text-base font-bold text-gray-900">{sesion.tecnico_opu}</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-xl p-3.5 border border-teal-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
            <p className="text-xs font-semibold text-teal-700 mb-1.5 uppercase tracking-wide">Técnico búsqueda</p>
            <div className="flex items-center gap-2.5">
              <div className="bg-teal-600 p-2 rounded-lg shadow-sm">
                <span className="text-white text-lg">🔬</span>
              </div>
              <span className="text-base font-bold text-gray-900">{sesion.tecnico_busqueda}</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-3.5 border border-amber-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
            <p className="text-xs font-semibold text-amber-700 mb-1.5 uppercase tracking-wide">Finalidad</p>
            <div className="flex items-center gap-2.5">
              <div className="bg-amber-600 p-2 rounded-lg shadow-sm">
                <Target size={18} className="text-white" />
              </div>
              <span className="text-base font-bold text-gray-900 capitalize">{sesion.finalidad}</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-3.5 border border-green-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
            <p className="text-xs font-semibold text-green-700 mb-1.5 uppercase tracking-wide">Hacienda</p>
            <div className="flex items-center gap-2.5">
              <div className="bg-green-600 p-2 rounded-lg shadow-sm">
                <span className="text-white text-lg">🏡</span>
              </div>
              <span className="text-base font-bold text-gray-900">{sesion.hacienda || '-'}</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-xl p-3.5 border border-pink-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
            <p className="text-xs font-semibold text-pink-700 mb-1.5 uppercase tracking-wide">Receptoras</p>
            <div className="flex items-center gap-2.5">
              <div className="bg-pink-600 p-2 rounded-lg shadow-sm">
                <span className="text-white text-lg">🐄</span>
              </div>
              <span className="text-base font-bold text-gray-900">{sesion.receptoras || '-'}</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 rounded-xl p-3.5 border border-cyan-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
            <p className="text-xs font-semibold text-cyan-700 mb-1.5 uppercase tracking-wide">Medio</p>
            <div className="flex items-center gap-2.5">
              <div className="bg-cyan-600 p-2 rounded-lg shadow-sm">
                <span className="text-white text-lg">🧪</span>
              </div>
              <span className="text-base font-bold text-gray-900">{sesion.medio || '-'}</span>
            </div>
          </div>
        </div>

        {sesion.observaciones && (
          <div className="mt-4 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-4 border-2 border-slate-200 shadow-inner">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-slate-600 p-1.5 rounded-lg">
                <span className="text-white text-sm">📝</span>
              </div>
              <p className="text-sm font-bold text-slate-700 uppercase tracking-wide">Observaciones</p>
            </div>
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed pl-1">{sesion.observaciones}</p>
          </div>
        )}
      </div>

      {dash && (
        <>
          {/* KPIs Cards - 3 columnas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <Target className="text-blue-600" size={24} />
                <p className="text-4xl font-bold text-blue-900">{dash.totalViables}</p>
              </div>
              <p className="text-sm font-medium text-blue-800">Total Viables</p>
              <p className="text-xs text-blue-600 mt-1">GI + GII + GIII + Desnudos</p>
            </div>

            <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="text-green-600" size={24} />
                <p className="text-4xl font-bold text-green-900">{dash.tasaViabilidad}%</p>
              </div>
              <p className="text-sm font-medium text-green-800">Tasa de Viabilidad</p>
              <p className="text-xs text-green-600 mt-1">{dash.totalViables} de {dash.totalOvocitos} ovocitos</p>
            </div>

            <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <Award className="text-purple-600" size={24} />
                <p className="text-4xl font-bold text-purple-900">{dash.tasaExcelencia}%</p>
              </div>
              <p className="text-sm font-medium text-purple-800">Tasa de Excelencia</p>
              <p className="text-xs text-purple-600 mt-1">GI + GII de total viables</p>
            </div>

            <div className="card bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">👥</span>
                <p className="text-4xl font-bold text-amber-900">{dash.totalDonadoras}</p>
              </div>
              <p className="text-sm font-medium text-amber-800">Total Donadoras</p>
              <p className="text-xs text-amber-600 mt-1">En esta sesión OPU</p>
            </div>

            <div className="card bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">📊</span>
                <p className="text-4xl font-bold text-cyan-900">{dash.promedioViablesPorDonadora}</p>
              </div>
              <p className="text-sm font-medium text-cyan-800">Promedio por Donadora</p>
              <p className="text-xs text-cyan-600 mt-1">Ovocitos viables</p>
            </div>

            <div className="card bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">⭐</span>
                <p className="text-4xl font-bold text-indigo-900">{dash.tasaGI}%</p>
              </div>
              <p className="text-sm font-medium text-indigo-800">Tasa Grado I</p>
              <p className="text-xs text-indigo-600 mt-1">{dash.gi} GI de {dash.totalViables} viables</p>
            </div>

            <div className="card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">❌</span>
                <p className="text-4xl font-bold text-red-900">{dash.totalIrregular}</p>
              </div>
              <p className="text-sm font-medium text-red-800">Irregulares</p>
              <p className="text-xs text-red-600 mt-1">Ovocitos no viables</p>
            </div>

            <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">🔘</span>
                <p className="text-4xl font-bold text-orange-900">{dash.totalDesnudos}</p>
              </div>
              <p className="text-sm font-medium text-orange-800">Desnudos</p>
              <p className="text-xs text-orange-600 mt-1">Sin células de cumulus</p>
            </div>

            <div className="card bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">📈</span>
                <p className="text-4xl font-bold text-teal-900">{dash.totalOvocitos}</p>
              </div>
              <p className="text-sm font-medium text-teal-800">Total Ovocitos</p>
              <p className="text-xs text-teal-600 mt-1">Extraídos en sesión</p>
            </div>
          </div>

          {/* Top 3 Donadoras */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              Top 3 Mejores Donadoras
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dash.topDonadoras.map((d, idx) => (
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
                    <span className="text-2xl font-bold text-gray-800">{d.total}</span>
                  </div>
                  <p className="text-gray-900 font-semibold text-sm mb-2 line-clamp-2">{d.label}</p>
                  <div className="flex gap-2 text-xs flex-wrap">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">GI: {d.gi}</span>
                    <span className="bg-sky-100 text-sky-800 px-2 py-1 rounded font-medium">GII: {d.gii}</span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-medium">GIII: {d.giii}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gráficos con Victory */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gráfico de Barras - Distribución por Grado */}
            <div className="card shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-white to-blue-50/30">
              <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                <span className="text-2xl">📊</span>
                <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Cantidad por Grado</span>
              </h3>
              <p className="text-xs text-gray-600 mb-2">
                Distribución de los {dash.totalOvocitos} ovocitos extraídos.
                {dash.totalViables > 0 && ` ${dash.totalViables} viables (${dash.tasaViabilidad}%)`}
                {dash.totalIrregular > 0 && ` y ${dash.totalIrregular} irregulares.`}
              </p>
              <div className="bg-white rounded-xl p-2 shadow-inner">
                <VictoryChart
                  theme={VictoryTheme.material}
                  domainPadding={20}
                  height={220}
                  padding={{ top: 20, bottom: 45, left: 50, right: 30 }}
                >
                  <VictoryAxis
                    tickFormat={(t) => t}
                    style={{
                      tickLabels: {
                        fontSize: 9,
                        padding: 5,
                        fontWeight: '600',
                        fill: '#1f2937'
                      },
                      axis: { stroke: '#94a3b8', strokeWidth: 1.5 }
                    }}
                  />
                  <VictoryAxis
                    dependentAxis
                    tickFormat={(x) => Math.round(x)}
                    style={{
                      tickLabels: {
                        fontSize: 9,
                        padding: 5,
                        fontWeight: '600',
                        fill: '#1f2937'
                      },
                      axis: { stroke: '#94a3b8', strokeWidth: 1.5 },
                      grid: { stroke: '#e2e8f0', strokeWidth: 0.5, strokeDasharray: '4,4' }
                    }}
                  />
                  <VictoryBar
                    data={dash.victoryBarData}
                    x="grado"
                    y="cantidad"
                    cornerRadius={{ top: 8, bottom: 2 }}
                    animate={{
                      duration: 500,
                      onLoad: { duration: 500 }
                    }}
                    style={{
                      data: {
                        fill: ({ datum }) => datum.fill,
                        fillOpacity: 0.95,
                        strokeWidth: 0
                      }
                    }}
                    labels={({ datum }) => datum.cantidad > 0 ? datum.cantidad : ''}
                    labelComponent={
                      <VictoryLabel
                        dy={-8}
                        style={{
                          fontSize: 10,
                          fill: '#0f172a',
                          fontWeight: 'bold'
                        }}
                      />
                    }
                  />
                </VictoryChart>
              </div>
              <div className="p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500 shadow-sm mt-2">
                <p className="text-xs text-blue-900 font-medium">
                  💡 {dash.victoryBarData.reduce((max, item) => item.cantidad > max.cantidad ? item : max).grado} tiene la mayor cantidad con {dash.victoryBarData.reduce((max, item) => item.cantidad > max.cantidad ? item : max).cantidad} ovocitos
                </p>
              </div>
            </div>

            {/* Gráfico de Barras Apiladas - Top 3 por Grado */}
            <div className="card shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-white to-amber-50/30">
              <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                <span className="bg-gradient-to-r from-amber-600 to-orange-700 bg-clip-text text-transparent">Top 3 Donadoras por Grado</span>
              </h3>
              <p className="text-xs text-gray-600 mb-2">
                Comparativa de las 3 mejores donadoras mostrando distribución por grado (GI, GII, GIII).
              </p>
              <div className="bg-white rounded-xl p-2 shadow-inner">
                <VictoryChart
                  theme={VictoryTheme.material}
                  domainPadding={30}
                  height={200}
                  padding={{ top: 20, bottom: 35, left: 50, right: 30 }}
                >
                  <VictoryAxis
                    tickFormat={(t) => ['', '🥇', '🥈', '🥉'][t] || ''}
                    style={{
                      tickLabels: {
                        fontSize: 14,
                        padding: 5,
                        fill: '#1f2937'
                      },
                      axis: { stroke: '#94a3b8', strokeWidth: 1.5 }
                    }}
                  />
                  <VictoryAxis
                    dependentAxis
                    tickFormat={(x) => Math.round(x)}
                    style={{
                      tickLabels: {
                        fontSize: 9,
                        padding: 5,
                        fontWeight: '600',
                        fill: '#1f2937'
                      },
                      axis: { stroke: '#94a3b8', strokeWidth: 1.5 },
                      grid: { stroke: '#e2e8f0', strokeWidth: 0.5, strokeDasharray: '4,4' }
                    }}
                  />
                  <VictoryStack
                    colorScale={['#1d4ed8', '#0ea5e9', '#22c55e']}
                    animate={{
                      duration: 500,
                      onLoad: { duration: 500 }
                    }}
                  >
                    <VictoryBar
                      data={dash.victoryStackData.gi}
                      cornerRadius={{ top: 2 }}
                      labels={({ datum }) => datum.y > 0 ? `GI: ${datum.y}` : ''}
                      labelComponent={
                        <VictoryTooltip
                          style={{ fontSize: 9, fontWeight: 'bold', fill: '#ffffff' }}
                          flyoutStyle={{ fill: '#1e3a8a', stroke: '#3b82f6', strokeWidth: 2 }}
                          cornerRadius={4}
                        />
                      }
                    />
                    <VictoryBar
                      data={dash.victoryStackData.gii}
                      cornerRadius={{ top: 2 }}
                      labels={({ datum }) => datum.y > 0 ? `GII: ${datum.y}` : ''}
                      labelComponent={
                        <VictoryTooltip
                          style={{ fontSize: 9, fontWeight: 'bold', fill: '#ffffff' }}
                          flyoutStyle={{ fill: '#0c4a6e', stroke: '#0ea5e9', strokeWidth: 2 }}
                          cornerRadius={4}
                        />
                      }
                    />
                    <VictoryBar
                      data={dash.victoryStackData.giii}
                      cornerRadius={{ top: 2 }}
                      labels={({ datum }) => datum.y > 0 ? `GIII: ${datum.y}` : ''}
                      labelComponent={
                        <VictoryTooltip
                          style={{ fontSize: 9, fontWeight: 'bold', fill: '#ffffff' }}
                          flyoutStyle={{ fill: '#14532d', stroke: '#22c55e', strokeWidth: 2 }}
                          cornerRadius={4}
                        />
                      }
                    />
                  </VictoryStack>
                </VictoryChart>
              </div>

              {/* Nombres de las donadoras */}
              <div className="grid grid-cols-3 gap-2 mb-2 mt-2">
                {dash.topDonadoras.map((d, idx) => (
                  <div key={idx} className="text-center bg-white/50 rounded-lg p-1.5 hover:bg-white transition-colors">
                    <div className="text-base mb-0.5">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                    </div>
                    <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight">
                      {d.label}
                    </p>
                    <p className="text-xs text-gray-600 font-medium">
                      {d.total} viables
                    </p>
                  </div>
                ))}
              </div>

              {/* Leyenda de grados */}
              <div className="flex justify-center gap-3 text-xs mb-2 border-t border-gray-200 pt-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-full">
                  <span className="w-3 h-3 bg-blue-700 rounded-full shadow-sm"></span>
                  <span className="font-medium text-gray-800">GI</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-sky-50 rounded-full">
                  <span className="w-3 h-3 bg-sky-500 rounded-full shadow-sm"></span>
                  <span className="font-medium text-gray-800">GII</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-full">
                  <span className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></span>
                  <span className="font-medium text-gray-800">GIII</span>
                </div>
              </div>

              <div className="p-2.5 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border-l-4 border-amber-500 shadow-sm">
                <p className="text-xs text-amber-900 font-medium">
                  💡 {dash.topDonadoras[0]?.label} lidera con {dash.topDonadoras[0]?.total} ovocitos viables
                </p>
              </div>
            </div>
          </div>

          {/* Gráfico de Pastel y Línea de Tiempo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gráfico de Pastel */}
            <div className="card shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-white to-purple-50/30">
              <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Distribución Total</span>
              </h3>
              <p className="text-xs text-gray-600 mb-2">
                Proporción de cada categoría sobre el total de {dash.totalOvocitos} ovocitos extraídos.
              </p>
              {dash.victoryPieData.length > 0 ? (
                <>
                  <div className="bg-white rounded-xl p-2 shadow-inner flex items-center justify-center">
                    <VictoryPie
                      data={dash.victoryPieData}
                      colorScale={['#1d4ed8', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444']}
                      labels={() => ''}
                      height={220}
                      innerRadius={35}
                      padAngle={3}
                      style={{
                        data: {
                          fillOpacity: 0.95,
                          strokeWidth: 2,
                          stroke: '#ffffff'
                        }
                      }}
                      animate={{
                        duration: 500,
                        onLoad: { duration: 500 }
                      }}
                    />
                  </div>

                  {/* Leyenda inferior con colores */}
                  <div className="mt-3 space-y-2">
                    {dash.victoryPieData.map((item, idx) => {
                      const percentage = ((item.y / dash.totalOvocitos) * 100).toFixed(1)
                      const colors = ['#1d4ed8', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444']
                      return (
                        <div key={idx} className="flex items-center justify-between bg-white/70 rounded-lg px-3 py-2 hover:bg-white transition-colors">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-4 h-4 rounded-full shadow-md ring-2 ring-white"
                              style={{ backgroundColor: colors[idx] }}
                            />
                            <span className="text-sm font-semibold text-gray-800">{item.x}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-gray-900">{item.y}</span>
                            <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full min-w-[50px] text-center">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="p-2.5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-l-4 border-purple-500 shadow-sm mt-3">
                    <p className="text-xs text-purple-900 font-medium">
                      💡 Viables: {dash.tasaViabilidad}% del total.
                      {dash.gi > 0 && ` ${dash.gi} GI (${dash.tasaGI}% de viables)`}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center py-8">Sin datos para mostrar</p>
              )}
            </div>

            {/* Línea de Tiempo */}
            <div className="card shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-white via-emerald-50/20 to-green-50/30">
              <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                <span className="text-2xl">📈</span>
                <span className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 bg-clip-text text-transparent">Evolución Temporal</span>
              </h3>
              <p className="text-xs text-gray-600 mb-2">
                Tendencia de ovocitos viables ({dash.victoryTimelineData.length} extracciones). Pasa el cursor sobre los puntos.
              </p>
              {dash.victoryTimelineData.length > 0 ? (
                <div>
                  <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-2 shadow-inner border border-slate-100">
                    <VictoryChart
                      theme={VictoryTheme.material}
                      height={220}
                      padding={{ top: 20, bottom: 45, left: 50, right: 30 }}
                    >
                      <VictoryAxis
                        tickFormat={(t) => `#${t}`}
                        style={{
                          tickLabels: {
                            fontSize: 9,
                            padding: 5,
                            fontWeight: '600',
                            fill: '#334155'
                          },
                          axis: { stroke: '#cbd5e1', strokeWidth: 2 }
                        }}
                      />
                      <VictoryAxis
                        dependentAxis
                        tickFormat={(x) => Math.round(x)}
                        style={{
                          tickLabels: {
                            fontSize: 9,
                            padding: 5,
                            fontWeight: '600',
                            fill: '#334155'
                          },
                          axis: { stroke: '#cbd5e1', strokeWidth: 2 },
                          grid: { stroke: '#e2e8f0', strokeWidth: 0.5, strokeDasharray: '3,3' }
                        }}
                      />
                      {/* Área con gradiente verde */}
                      <VictoryArea
                        data={dash.victoryTimelineData}
                        style={{
                          data: {
                            fill: 'url(#greenGradient)',
                            fillOpacity: 0.5
                          }
                        }}
                        animate={{
                          duration: 800,
                          onLoad: { duration: 800 },
                          easing: 'cubicInOut'
                        }}
                      />
                      {/* Línea principal verde */}
                      <VictoryLine
                        data={dash.victoryTimelineData}
                        style={{
                          data: {
                            stroke: 'url(#lineGreenGradient)',
                            strokeWidth: 4,
                            strokeLinecap: 'round',
                            filter: 'drop-shadow(0px 2px 4px rgba(16, 185, 129, 0.4))'
                          }
                        }}
                        animate={{
                          duration: 800,
                          onLoad: { duration: 800 },
                          easing: 'cubicInOut'
                        }}
                      />
                      {/* Puntos grandes sin etiquetas visibles */}
                      <VictoryScatter
                        data={dash.victoryTimelineData}
                        size={7}
                        style={{
                          data: {
                            fill: '#10b981',
                            stroke: '#ffffff',
                            strokeWidth: 3,
                            filter: 'drop-shadow(0px 3px 6px rgba(16, 185, 129, 0.4))'
                          }
                        }}
                        events={[{
                          target: "data",
                          eventHandlers: {
                            onMouseOver: (evt, targetProps) => {
                              const { datum } = targetProps;
                              return [
                                {
                                  target: "labels",
                                  mutation: () => ({
                                    active: true,
                                    text: `🕐 ${datum.label}\n✓ ${datum.y} viables`
                                  })
                                },
                                {
                                  target: "data",
                                  mutation: () => ({ size: 10, fill: '#059669', strokeWidth: 4 })
                                }
                              ];
                            },
                            onMouseOut: () => [
                              {
                                target: "labels",
                                mutation: () => ({ active: false, text: '' })
                              },
                              {
                                target: "data",
                                mutation: () => ({ size: 7, fill: '#10b981', strokeWidth: 3 })
                              }
                            ]
                          }
                        }]}
                        labels={() => ''}
                        labelComponent={
                          <VictoryTooltip
                            active={false}
                            style={{ fontSize: 9, fontWeight: 'bold', fill: '#ffffff' }}
                            flyoutStyle={{
                              fill: '#047857',
                              stroke: '#10b981',
                              strokeWidth: 2,
                              filter: 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.15))'
                            }}
                            cornerRadius={6}
                            pointerLength={8}
                          />
                        }
                        animate={{
                          duration: 800,
                          onLoad: { duration: 800 },
                          easing: 'bounce'
                        }}
                      />
                      <defs>
                        {/* Gradiente verde para el área */}
                        <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.7" />
                          <stop offset="50%" stopColor="#059669" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#047857" stopOpacity="0.2" />
                        </linearGradient>
                        {/* Gradiente verde para la línea */}
                        <linearGradient id="lineGreenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#34d399" />
                          <stop offset="50%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                      </defs>
                    </VictoryChart>
                  </div>
                  <div className="p-2.5 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 rounded-lg border-l-4 border-emerald-500 shadow-sm mt-2">
                    <p className="text-xs text-emerald-900 font-medium flex items-center gap-1">
                      <span className="text-sm">📊</span>
                      <span>Promedio: <strong>{dash.promedioViablesPorDonadora}</strong> viables</span>
                      {dash.victoryTimelineData.length > 0 && (
                        <>
                          <span className="mx-1">•</span>
                          <span>Máximo: <strong>{Math.max(...dash.victoryTimelineData.map(d => d.y))}</strong></span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Sin datos de hora de extracción</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
