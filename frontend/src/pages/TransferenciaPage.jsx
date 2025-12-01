import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Eye, FileText, Plus, Trash2 } from 'lucide-react'
import donadoraService from '../services/donadoraService'
import sesionTransferenciaService from '../services/sesionTransferenciaService'

export default function TransferenciaPage() {
  const navigate = useNavigate()
  const [sesiones, setSesiones] = useState([])
  const [loading, setLoading] = useState(true)
  const [donadorasCache, setDonadorasCache] = useState([])

  useEffect(() => {
    loadSesiones()
  }, [])

  const loadSesiones = async () => {
    setLoading(true)
    try {
      const data = await sesionTransferenciaService.getAll()
      setSesiones(data || [])
    } catch (error) {
      console.error('Error cargando sesiones de transferencia', error)
      alert('No se pudieron cargar las sesiones')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSesion = async (sesion) => {
    if (!window.confirm('¿Eliminar la sesión y sus transferencias?')) return
    try {
      await sesionTransferenciaService.remove(sesion.id)
      await loadSesiones()
    } catch (error) {
      console.error(error)
      alert('No se pudo eliminar la sesión')
    }
  }

  const getDonadoraLabel = (donadoraId, cache = []) => {
    const found = cache.find(d => d.id === donadoraId)
    return found ? `${found.nombre} (${found.numero_registro || '-'})` : (donadoraId ? `ID ${donadoraId}` : '-')
  }

  const getDonadoraRaza = (donadoraId, cache = []) => {
    const found = cache.find(d => d.id === donadoraId)
    return found?.raza || '-'
  }

  const handleGenerateInforme = async (sesion) => {
    // Abrir ventana antes de llamadas async para evitar bloqueo de popup
    const win = window.open('', '_blank')
    const popupDisponible = !!(win && win.document)

    const fallbackDownload = (html, id) => {
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `informe-transferencia-${id}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }

    try {
      if (popupDisponible) {
        win.document.write('<p style="font-family:Arial;padding:16px;">Generando informe de transferencia...</p>')
      }

      let donas = donadorasCache
      if (!donas || donas.length === 0) {
        const response = await donadoraService.getAll({ limit: 1000, activo: true })
        donas = response.donadoras || []
        setDonadorasCache(donas)
      }

      const detail = await sesionTransferenciaService.getById(sesion.id)
      const transferencias = detail.transferencias_realizadas || []

      const total = transferencias.length
      const conDonadora = transferencias.filter(t => t.donadora_id).length
      const receptoras = new Set(transferencias.filter(t => t.receptora).map(t => t.receptora)).size
      const estados = new Set(transferencias.filter(t => t.estado).map(t => t.estado)).size
      const finalidadesSet = new Set(transferencias.filter(t => t.finalidad).map(t => t.finalidad))
      const finalidadTexto = finalidadesSet.size === 0
        ? '-'
        : finalidadesSet.size === 1
          ? Array.from(finalidadesSet)[0]
          : Array.from(finalidadesSet).join(', ')

      const rowsHtml = transferencias.map((t, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${getDonadoraLabel(t.donadora_id, donas)}</td>
          <td>${getDonadoraRaza(t.donadora_id, donas)}</td>
          <td>${t.toro || ''}</td>
          <td>${t.raza_toro || ''}</td>
          <td>${t.receptora || ''}</td>
          <td>${t.estado || ''}</td>
          <td>${t.finalidad || ''}</td>
          <td>${t.fecha ? t.fecha.split('T')[0] : ''}</td>
          <td>${t.ciclado_izquierdo || ''}</td>
          <td>${t.ciclado_derecho || ''}</td>
          <td>${t.observaciones || ''}</td>
        </tr>
      `).join('')

      const fechaStr = detail.fecha ? new Date(detail.fecha).toLocaleDateString('es-ES') : ''

      const html = `
        <html>
          <head>
            <title>Protocolo de transferencias de embriones #${detail.id}</title>
            <style>
              @media print { @page { margin: 1.5cm; } }
              body { font-family: Arial, sans-serif; padding: 16px; color: #111; max-width: 1200px; margin: 0 auto; }
              .header { border-bottom: 3px solid #0f766e; padding-bottom: 12px; margin-bottom: 16px; }
              .header h1 { margin: 0 0 4px 0; color: #0f766e; font-size: 24px; }
              .header .subtitle { color: #555; font-size: 14px; margin: 2px 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 16px; }
              th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; }
              th { background: #f1f5f9; text-align: left; }
              .kpi { display: inline-block; margin-right: 12px; padding: 6px 10px; background: #ecfeff; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; }
              .meta { margin-top: 8px; }
              .meta strong { color: #0f172a; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Protocolo de transferencias de embriones</h1>
              <div class="subtitle">Sesión #${detail.id}${fechaStr ? ' · ' + fechaStr : ''}</div>
              <div class="subtitle meta"><strong>Finalidad:</strong> ${finalidadTexto}</div>
              <div class="subtitle meta"><strong>Cliente:</strong> ${detail.cliente || '-'}</div>
              <div class="subtitle meta"><strong>Técnico de transferencia:</strong> ${detail.tecnico_transferencia || '-'}</div>
              <div class="subtitle meta"><strong>Hora final:</strong> ${detail.hora_final || '-'}</div>
              <div class="subtitle meta"><strong>Fecha:</strong> ${fechaStr || '-'}</div>
              <div class="subtitle meta"><strong>Receptoras:</strong> ${detail.receptoras || '-'}</div>
              ${detail.hacienda ? `<div class="subtitle meta"><strong>Hacienda:</strong> ${detail.hacienda}</div>` : ''}
            </div>

            <div style="margin-bottom:12px;">
              <span class="kpi">Total transferencias: ${total}</span>
              <span class="kpi">Con donadora: ${conDonadora}</span>
              <span class="kpi">Receptoras únicas: ${receptoras}</span>
              <span class="kpi">Estados distintos: ${estados}</span>
            </div>

            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Donadora</th>
                  <th>Toro</th>
                  <th>Raza toro</th>
                  <th>Receptora</th>
                  <th>Estado</th>
                  <th>Finalidad</th>
                  <th>Fecha</th>
                  <th>Ciclado izq.</th>
                  <th>Ciclado der.</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </body>
        </html>
      `

      if (popupDisponible) {
        win.document.open()
        win.document.write(html)
        win.document.close()
        win.focus()
      } else {
        fallbackDownload(html, detail.id)
      }
    } catch (error) {
      console.error('No se pudo generar el informe de transferencia', error)
      if (popupDisponible) {
        win.document.write('<p style="font-family:Arial;padding:16px;color:#b91c1c;">No se pudo generar el informe.</p>')
      }
      alert('No se pudo generar el informe')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Módulo Transferencias</h1>
          <p className="text-gray-600">Gestiona las sesiones registradas</p>
        </div>
        <button
          onClick={() => navigate('/transferencia/nueva')}
          className="btn-primary flex items-center space-x-2 self-start md:self-center"
        >
          <Plus size={18} />
          <span>Nueva sesión</span>
        </button>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Sesiones de Transferencia</h2>
          <button onClick={loadSesiones} className="btn-secondary">Refrescar</button>
        </div>

        {loading ? (
          <p className="text-gray-600 text-center py-6">Cargando...</p>
        ) : sesiones.length === 0 ? (
          <p className="text-gray-600 text-center py-6">No hay sesiones registradas</p>
        ) : (
          <div className="space-y-4">
            {sesiones.map((sesion) => {
              const lista = sesion.transferencias_realizadas || []
              const totalTransferencias = lista.length
              const conDonadora = lista.filter(t => t.donadora_id).length
              const estados = new Set(lista.filter(t => t.estado).map(t => t.estado)).size
              const receptoras = new Set(lista.filter(t => t.receptora).map(t => t.receptora)).size

              return (
                <div
                  key={sesion.id}
                  className="border-2 border-teal-200 rounded-xl p-5 bg-gradient-to-br from-white to-teal-50/40 hover:shadow-lg transition-all duration-300 hover:border-teal-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="bg-gradient-to-br from-teal-600 to-cyan-600 p-3 rounded-xl shadow-md">
                        <Calendar className="text-white" size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-gray-900">
                            {sesion.fecha ? new Date(sesion.fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Sin fecha'}
                          </h3>
                          <span className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded-full font-semibold">
                            ID: {sesion.id}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                          {sesion.tecnico_transferencia && (
                            <span className="font-medium flex items-center gap-1">
                              <span className="inline-block w-2 h-2 bg-teal-500 rounded-full" />
                              {sesion.tecnico_transferencia}
                            </span>
                          )}
                          {sesion.cliente && <span className="font-medium">· {sesion.cliente}</span>}
                          {sesion.hacienda && <span className="font-medium">· {sesion.hacienda}</span>}
                          {sesion.finalidad && (
                            <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs font-semibold capitalize">
                              {sesion.finalidad}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => navigate(`/transferencia/${sesion.fecha}`)}
                        className="btn-primary flex items-center gap-1.5 px-3 py-2 text-sm"
                      >
                        <Eye size={16} />
                        <span>Ver detalles</span>
                      </button>
                      <button
                        onClick={() => handleGenerateInforme(sesion)}
                        className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-sm"
                      >
                        <FileText size={16} />
                        <span>Informe</span>
                      </button>
                      <button
                        onClick={() => handleDeleteSesion(sesion)}
                        className="px-3 py-2 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg border border-red-200 transition-colors flex items-center gap-1.5 font-medium"
                      >
                        <Trash2 size={16} />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white/70 rounded-lg p-3 border border-teal-100">
                      <p className="text-xs text-teal-700 font-semibold uppercase mb-1">Transferencias</p>
                      <p className="text-2xl font-bold text-teal-900">{totalTransferencias}</p>
                    </div>
                    <div className="bg-white/70 rounded-lg p-3 border border-green-100">
                      <p className="text-xs text-green-700 font-semibold uppercase mb-1">Con donadora</p>
                      <p className="text-2xl font-bold text-green-900">{conDonadora}</p>
                    </div>
                    <div className="bg-white/70 rounded-lg p-3 border border-blue-100">
                      <p className="text-xs text-blue-700 font-semibold uppercase mb-1">Estados</p>
                      <p className="text-2xl font-bold text-blue-900">{estados}</p>
                    </div>
                    <div className="bg-white/70 rounded-lg p-3 border border-purple-100">
                      <p className="text-xs text-purple-700 font-semibold uppercase mb-1">Receptoras</p>
                      <p className="text-2xl font-bold text-purple-900">{receptoras}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
