import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Search, Trash2, X } from 'lucide-react'
import donadoraService from '../services/donadoraService'
import sesionTransferenciaService from '../services/sesionTransferenciaService'
import transferenciaService from '../services/transferenciaService'

export default function TransferenciaNuevaPage() {
  const navigate = useNavigate()
  const { register: registerSesion, handleSubmit: handleSubmitSesion, reset: resetSesion, formState: { errors: sesionErrors } } = useForm()
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm()

  const [sesion, setSesion] = useState(null)
  const [transferencias, setTransferencias] = useState([])
  const [selectedDonadora, setSelectedDonadora] = useState(null)
  const [donadorasList, setDonadorasList] = useState([])
  const [donadorasMap, setDonadorasMap] = useState({})
  const [donadoraSearch, setDonadoraSearch] = useState('')
  const [showDonadoraModal, setShowDonadoraModal] = useState(false)
  const [loadingSesion, setLoadingSesion] = useState(false)
  const [loadingTransfer, setLoadingTransfer] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const isSubmittingRef = useRef(false)

  useEffect(() => {
    const preload = async () => {
      try {
        const response = await donadoraService.getAll({ limit: 1000, activo: true })
        const list = response.donadoras || []
        setDonadorasList(list)
        const map = list.reduce((acc, d) => ({ ...acc, [d.id]: d }), {})
        setDonadorasMap(map)
      } catch (error) {
        console.error('Error cargando donadoras', error)
      }
    }
    preload()
  }, [])

  const filteredDonadoras = useMemo(() => {
    const term = donadoraSearch.trim().toLowerCase()
    if (!term) return donadorasList
    return donadorasList.filter(d => (`${d.nombre} ${d.numero_registro}`).toLowerCase().includes(term))
  }, [donadoraSearch, donadorasList])

  const nextNumeroSecuencial = useMemo(() => {
    if (!transferencias || transferencias.length === 0) return 1
    return Math.max(...transferencias.map(t => Number(t.numero_secuencial) || 0)) + 1
  }, [transferencias])

  const onSubmitSesion = async (data) => {
    setLoadingSesion(true)
    try {
      const created = await sesionTransferenciaService.create(data)
      setSesion(created)
      setTransferencias(created.transferencias_realizadas || [])
      resetSesion()
      alert('Sesión de transferencia creada')
    } catch (error) {
      console.error(error)
      alert('No se pudo crear la sesión')
    } finally {
      setLoadingSesion(false)
    }
  }

  const onSubmitTransfer = async (data) => {
    if (!sesion) {
      alert('Primero crea la sesión de transferencia')
      return
    }
    if (isSubmittingRef.current) return

    isSubmittingRef.current = true
    setLoadingTransfer(true)
    const payload = {
      ...data,
      numero_secuencial: parseInt(data.numero_secuencial, 10),
      donadora_id: selectedDonadora?.id || null,
      sesion_transferencia_id: sesion.id
    }

    try {
      if (editingId) {
        const updated = await transferenciaService.update(editingId, payload)
        setTransferencias((prev) => prev.map(t => t.id === editingId ? updated : t))
        alert('Transferencia actualizada')
      } else {
        const created = await transferenciaService.create(payload)
        setTransferencias((prev) => [...prev, created])
        alert('Transferencia registrada')
      }

      reset({
        numero_secuencial: nextNumeroSecuencial,
        fecha: '',
        tecnico_transferencia: '',
        cliente: '',
        finalidad: '',
        toro: '',
        raza_toro: '',
        estado: '',
        receptora: '',
        ciclado_izquierdo: '',
        ciclado_derecho: '',
        observaciones: ''
      })
      setSelectedDonadora(null)
      setEditingId(null)
    } catch (error) {
      console.error(error)
      alert('Error al guardar: ' + (error.response?.data?.detail || error.message))
    } finally {
      setLoadingTransfer(false)
      isSubmittingRef.current = false
    }
  }

  const handleEditTransfer = async (transferencia) => {
    setEditingId(transferencia.id)
    reset({
      numero_secuencial: transferencia.numero_secuencial,
      fecha: transferencia.fecha ? transferencia.fecha.split('T')[0] : '',
      tecnico_transferencia: transferencia.tecnico_transferencia || '',
      cliente: transferencia.cliente || '',
      finalidad: transferencia.finalidad || '',
      toro: transferencia.toro || '',
      raza_toro: transferencia.raza_toro || '',
      estado: transferencia.estado || '',
      receptora: transferencia.receptora || '',
      ciclado_izquierdo: transferencia.ciclado_izquierdo || '',
      ciclado_derecho: transferencia.ciclado_derecho || '',
      observaciones: transferencia.observaciones || ''
    })

    if (transferencia.donadora_id) {
      if (donadorasMap[transferencia.donadora_id]) {
        setSelectedDonadora(donadorasMap[transferencia.donadora_id])
      } else {
        const data = await donadoraService.getById(transferencia.donadora_id)
        setSelectedDonadora(data)
      }
    } else {
      setSelectedDonadora(null)
    }
  }

  const handleDeleteTransfer = async (id) => {
    if (!window.confirm('¿Eliminar transferencia?')) return
    try {
      await transferenciaService.delete(id)
      setTransferencias((prev) => prev.filter(t => t.id !== id))
    } catch (error) {
      console.error(error)
      alert('No se pudo eliminar')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/transferencia')}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            <span>Volver</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Nueva sesión de transferencia</h1>
            <p className="text-gray-600">Registra la sesión y los traspasos asociados</p>
          </div>
        </div>
        {sesion && (
          <div className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-semibold">
            Sesión creada (ID: {sesion.id})
          </div>
        )}
      </div>

      {/* Formulario de sesion */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Datos de la sesión</h2>
        <form onSubmit={handleSubmitSesion(onSubmitSesion)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <div className="flex gap-2">
              <input type="date" className="input-field flex-1" {...registerSesion('fecha', { required: true })} />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0]
                  resetSesion({ fecha: today })
                }}
              >
                Hoy
              </button>
            </div>
            {sesionErrors.fecha && <p className="text-red-500 text-sm">Fecha requerida</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Técnico de transferencia</label>
            <input className="input-field" {...registerSesion('tecnico_transferencia', { required: true })} />
            {sesionErrors.tecnico_transferencia && <p className="text-red-500 text-sm">Campo requerido</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <input className="input-field" {...registerSesion('cliente', { required: true })} />
            {sesionErrors.cliente && <p className="text-red-500 text-sm">Campo requerido</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Receptoras</label>
            <input className="input-field" {...registerSesion('receptoras')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio</label>
            <div className="flex gap-2">
              <input type="time" className="input-field flex-1" {...registerSesion('hora_inicio')} />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  const now = new Date()
                  const hh = String(now.getHours()).padStart(2, '0')
                  const mm = String(now.getMinutes()).padStart(2, '0')
                  resetSesion(prev => ({ ...(prev || {}), hora_inicio: `${hh}:${mm}` }))
                }}
              >
                Ahora
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hora final</label>
            <div className="flex gap-2">
              <input type="time" className="input-field flex-1" {...registerSesion('hora_final')} />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  const now = new Date()
                  const hh = String(now.getHours()).padStart(2, '0')
                  const mm = String(now.getMinutes()).padStart(2, '0')
                  resetSesion(prev => ({ ...(prev || {}), hora_final: `${hh}:${mm}` }))
                }}
              >
                Ahora
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hacienda</label>
            <input className="input-field" {...registerSesion('hacienda')} />
          </div>
          <div className="md:col-span-2 flex space-x-3">
            <button type="submit" className="btn-primary flex items-center space-x-2" disabled={loadingSesion}>
              <Save size={18} />
              <span>{loadingSesion ? 'Guardando...' : 'Guardar sesión'}</span>
            </button>
            <button type="button" className="btn-secondary" onClick={() => { resetSesion(); setSesion(null); setTransferencias([]) }}>Limpiar</button>
          </div>
        </form>
      </div>

      {/* Formulario de transferencia */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Registrar transferencia</h2>
          {!sesion && <span className="text-sm text-red-600">Crea la sesión primero</span>}
        </div>

        <form onSubmit={handleSubmit(onSubmitTransfer)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Donadora</label>
              <button
                type="button"
                onClick={() => setShowDonadoraModal(true)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!sesion}
              >
                {selectedDonadora ? (
                  <div>
                    <p className="font-medium text-gray-900">{selectedDonadora.nombre}</p>
                    <p className="text-sm text-gray-600">Registro: {selectedDonadora.numero_registro}</p>
                  </div>
                ) : (
                  <span className="text-gray-500">Seleccionar donadora...</span>
                )}
              </button>
              {selectedDonadora && (
                <button
                  type="button"
                  onClick={() => setSelectedDonadora(null)}
                  className="text-sm text-red-600 hover:text-red-800 mt-1"
                >
                  Limpiar selección
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N° secuencial *</label>
              <input
                type="number"
                className="input-field"
                {...register('numero_secuencial', { required: 'Campo requerido', min: 1 })}
                defaultValue={nextNumeroSecuencial}
                readOnly
              />
              {errors.numero_secuencial && <p className="text-red-500 text-sm">{errors.numero_secuencial.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <div className="flex gap-2">
                <input type="date" className="input-field flex-1" {...register('fecha')} />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0]
                    setValue('fecha', today)
                  }}
                  disabled={!sesion}
                >
                  Hoy
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Técnico de transferencia</label>
              <input className="input-field" {...register('tecnico_transferencia')} disabled={!sesion} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <input className="input-field" {...register('cliente')} disabled={!sesion} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Finalidad</label>
              <select className="input-field" {...register('finalidad')} disabled={!sesion}>
                <option value="">Seleccione</option>
                <option value="Fresh">Fresh</option>
                <option value="VIT">VIT</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Toro</label>
              <input className="input-field" {...register('toro')} disabled={!sesion} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Raza del toro</label>
              <input className="input-field" {...register('raza_toro')} disabled={!sesion} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <input className="input-field" {...register('estado')} disabled={!sesion} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Receptoras</label>
              <input className="input-field" {...register('receptora')} disabled={!sesion} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciclado izquierdo</label>
              <input className="input-field" {...register('ciclado_izquierdo')} disabled={!sesion} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciclado derecho</label>
              <input className="input-field" {...register('ciclado_derecho')} disabled={!sesion} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea className="input-field" rows={3} {...register('observaciones')} disabled={!sesion} />
          </div>

          <div className="flex space-x-4">
            <button type="submit" className="btn-primary flex items-center space-x-2" disabled={!sesion || loadingTransfer}>
              <Save size={18} />
              <span>{loadingTransfer ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar'}</span>
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                reset()
                setSelectedDonadora(null)
                setEditingId(null)
              }}
              disabled={!sesion}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>

      {/* Transferencias registradas */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Transferencias de la sesión</h2>
          <span className="text-sm text-gray-600">Total: {transferencias.length}</span>
        </div>

        {transferencias.length === 0 ? (
          <p className="text-gray-600 text-center py-4">Aún no hay transferencias registradas</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">N°</th>
                  <th className="px-3 py-2 text-left">Donadora</th>
                  <th className="px-3 py-2 text-left">Toro</th>
                  <th className="px-3 py-2 text-left">Receptora</th>
                  <th className="px-3 py-2 text-left">Estado</th>
                  <th className="px-3 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transferencias.map((t) => (
                  <tr key={t.id}>
                    <td className="px-3 py-2">{t.numero_secuencial}</td>
                    <td className="px-3 py-2">{t.donadora_id && donadorasMap[t.donadora_id] ? donadorasMap[t.donadora_id].nombre : '-'}</td>
                    <td className="px-3 py-2">{t.toro || '-'}</td>
                    <td className="px-3 py-2">{t.receptora || '-'}</td>
                    <td className="px-3 py-2">{t.estado || '-'}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-800 text-xs" onClick={() => handleEditTransfer(t)}>Editar</button>
                        <button className="text-red-600 hover:text-red-800 text-xs inline-flex items-center gap-1" onClick={() => handleDeleteTransfer(t.id)}>
                          <Trash2 size={14} />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showDonadoraModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-lg font-semibold">Seleccionar donadora</h3>
              <button onClick={() => setShowDonadoraModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Search size={16} className="text-gray-500" />
                <input
                  value={donadoraSearch}
                  onChange={(e) => setDonadoraSearch(e.target.value)}
                  className="input-field"
                  placeholder="Buscar por nombre o registro"
                  autoFocus
                />
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-200">
                {filteredDonadoras.length === 0 ? (
                  <p className="text-gray-600 text-center py-6">No se encontraron donadoras</p>
                ) : (
                  filteredDonadoras.map((donadora) => (
                    <button
                      key={donadora.id}
                      onClick={() => {
                        setSelectedDonadora(donadora)
                        setShowDonadoraModal(false)
                        setDonadoraSearch('')
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <p className="font-medium text-gray-800">{donadora.nombre}</p>
                      <p className="text-sm text-gray-600">Registro: {donadora.numero_registro} · {donadora.raza}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
