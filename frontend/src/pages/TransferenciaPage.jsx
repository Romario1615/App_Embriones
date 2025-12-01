import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Plus, Save, Eye, X, Trash2, Calendar, Search } from 'lucide-react'
import { useTransferenciaStore } from '../store/transferenciaStore'
import transferenciaService from '../services/transferenciaService'
import donadoraService from '../services/donadoraService'
import sesionTransferenciaService from '../services/sesionTransferenciaService'

export default function TransferenciaPage() {
  const navigate = useNavigate()
  const { transferencias, setTransferencias, addTransferencia, updateTransferencia, removeTransferencia } = useTransferenciaStore()
  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm()
  const { register: registerSesion, handleSubmit: handleSubmitSesion, reset: resetSesion, formState: { errors: sesionErrors } } = useForm()

  const [selectedDonadora, setSelectedDonadora] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [donadorasMap, setDonadorasMap] = useState({})
  const [loading, setLoading] = useState(false)
  const [loadingSesion, setLoadingSesion] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showSesionForm, setShowSesionForm] = useState(false)
  const [donadorasList, setDonadorasList] = useState([])
  const [donadoraSearch, setDonadoraSearch] = useState('')
  const [showDonadoraModal, setShowDonadoraModal] = useState(false)
  const [sesiones, setSesiones] = useState([])
  const [selectedSesionId, setSelectedSesionId] = useState(null)
  const isSubmittingRef = useRef(false)

  useEffect(() => {
    loadSesionesTransferencia()
    preloadDonadoras()
    loadDonadoras()
  }, [])

  const preloadDonadoras = async () => {
    try {
      const response = await donadoraService.getAll({ limit: 1000 })
      const donadoras = response.donadoras || []
      const map = donadoras.reduce((acc, d) => ({ ...acc, [d.id]: d }), {})
      setDonadorasMap(map)
    } catch (error) {
      console.error('Error cargando donadoras', error)
    }
  }

  const loadDonadoras = async () => {
    try {
      const response = await donadoraService.getAll({ limit: 1000, activo: true })
      const donadoras = response.donadoras || []
      setDonadorasList(donadoras)
    } catch (error) {
      console.error('Error cargando donadoras:', error)
    }
  }

  const filteredDonadoras = useMemo(() => {
    const term = donadoraSearch.trim().toLowerCase()
    if (!term) return donadorasList
    return donadorasList.filter(d =>
      `${d.nombre} ${d.numero_registro}`.toLowerCase().includes(term)
    )
  }, [donadoraSearch, donadorasList])

  const nextNumeroSecuencial = useMemo(() => {
    const lista = selectedSesionId
      ? transferencias.filter(t => t.sesion_transferencia_id === selectedSesionId)
      : transferencias
    if (!lista || lista.length === 0) return 1
    return Math.max(...lista.map(t => Number(t.numero_secuencial) || 0)) + 1
  }, [transferencias, selectedSesionId])

  const handleSelectDonadora = (donadora) => {
    setSelectedDonadora(donadora)
    setShowDonadoraModal(false)
    setDonadoraSearch('')
  }

  const loadSesionesTransferencia = async () => {
    try {
      const data = await sesionTransferenciaService.getAll()
      setSesiones(data || [])
      const allTransferencias = (data || []).flatMap(s => (s.transferencias_realizadas || []).map(t => ({
        ...t,
        sesion_transferencia_id: s.id,
        sesion_fecha: s.fecha,
        sesion_tecnico: s.tecnico_transferencia
      })))
      setTransferencias(allTransferencias)
      if (!selectedSesionId && data && data.length > 0) {
        setSelectedSesionId(data[0].id)
      }
    } catch (error) {
      console.error('Error cargando sesiones de transferencia', error)
    }
  }

  const onSubmitSesion = async (data) => {
    setLoadingSesion(true)
    try {
      const created = await sesionTransferenciaService.create(data)
      await loadSesionesTransferencia()
      setSelectedSesionId(created.id)
      resetSesion()
      setShowSesionForm(false)
      alert('Sesión de transferencia creada')
    } catch (error) {
      console.error(error)
      alert('No se pudo crear la sesión')
    } finally {
      setLoadingSesion(false)
    }
  }

  const onSubmit = async (data) => {
    if (isSubmittingRef.current) return
    if (!selectedSesionId) {
      alert('Selecciona o crea una sesión de transferencia primero')
      return
    }

    isSubmittingRef.current = true
    setLoading(true)
    const payload = {
      ...data,
      numero_secuencial: parseInt(data.numero_secuencial, 10),
      donadora_id: selectedDonadora?.id || null,
      sesion_transferencia_id: selectedSesionId
    }

    try {
      if (editingId) {
        const updated = await transferenciaService.update(editingId, payload)
        updateTransferencia(editingId, updated)
        alert('Transferencia actualizada')
      } else {
        const created = await transferenciaService.create(payload)
        addTransferencia(created)
        alert('Transferencia registrada')
      }
      await loadSesionesTransferencia()
      reset()
      setSelectedDonadora(null)
      setEditingId(null)
      setShowForm(false)
    } catch (error) {
      console.error(error)
      alert('Error al guardar: ' + (error.response?.data?.detail || error.message))
    } finally {
      setLoading(false)
      isSubmittingRef.current = false
    }
  }

  const handleEdit = async (transferencia) => {
    setEditingId(transferencia.id)
    setShowForm(true)
    setSelectedSesionId(transferencia.sesion_transferencia_id || null)
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
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar transferencia?')) return
    try {
      await transferenciaService.delete(id)
      removeTransferencia(id)
    } catch (error) {
      console.error(error)
      alert('No se pudo eliminar')
    }
  }

  const handleEditSesion = (sesion) => {
    setShowForm(true)
    setSelectedSesionId(sesion.id)
    const lista = sesion.transferencias_realizadas || []
    const nextNum = lista.length > 0 ? Math.max(...lista.map(t => Number(t.numero_secuencial) || 0)) + 1 : 1
    reset({
      numero_secuencial: nextNum,
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
  }

  const handleDeleteSesion = async (sesion) => {
    if (!window.confirm('¿Eliminar la sesión y sus transferencias?')) return
    try {
      await sesionTransferenciaService.remove(sesion.id)
      await loadSesionesTransferencia()
      if (selectedSesionId === sesion.id) setSelectedSesionId(null)
    } catch (error) {
      console.error(error)
      alert('No se pudo eliminar la sesión')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Módulo Transferencias</h1>
          <p className="text-gray-600">Gestiona sesiones y los registros por donadora</p>
        </div>
        <button
          onClick={() => setShowSesionForm(!showSesionForm)}
          className="btn-primary flex items-center space-x-2 self-start md:self-center"
        >
          {showSesionForm ? <X size={18} /> : <Plus size={18} />}
          <span>{showSesionForm ? 'Cerrar sesión' : 'Nueva sesión'}</span>
        </button>
      </div>

      {showSesionForm && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Registrar sesión de transferencia</h2>
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
              <input className="input-field" {...registerSesion('hora_inicio')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora final</label>
              <input className="input-field" {...registerSesion('hora_final')} />
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
              <button type="button" className="btn-secondary" onClick={() => { resetSesion(); setShowSesionForm(false) }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Editar transferencia' : 'Registrar transferencia'}
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Donadora</label>
                <button
                  type="button"
                  onClick={() => setShowDonadoraModal(true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Sesión</label>
                <select
                  className="input-field"
                  value={selectedSesionId || ''}
                  onChange={(e) => setSelectedSesionId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Seleccione sesión</option>
                  {sesiones.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fecha} - {s.tecnico_transferencia}
                    </option>
                  ))}
                </select>
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
                  >
                    Hoy
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Técnico de transferencia</label>
                <input className="input-field" {...register('tecnico_transferencia')} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <input className="input-field" {...register('cliente')} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Finalidad</label>
                <select className="input-field" {...register('finalidad')}>
                  <option value="">Seleccione</option>
                  <option value="Fresh">Fresh</option>
                  <option value="VIT">VIT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Toro</label>
                <input className="input-field" {...register('toro')} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Raza del toro</label>
                <input className="input-field" {...register('raza_toro')} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <input className="input-field" {...register('estado')} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receptoras</label>
                <input className="input-field" {...register('receptora')} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ciclado izquierdo</label>
                <input className="input-field" {...register('ciclado_izquierdo')} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ciclado derecho</label>
                <input className="input-field" {...register('ciclado_derecho')} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea className="input-field" rows={3} {...register('observaciones')} />
            </div>

            <div className="flex space-x-4">
              <button type="submit" className="btn-primary flex items-center space-x-2" disabled={loading}>
                <Save size={18} />
                <span>{loading ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar'}</span>
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  reset()
                  setSelectedDonadora(null)
                  setEditingId(null)
                  setShowForm(false)
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Sesiones de Transferencia</h2>
          <button onClick={loadSesionesTransferencia} className="btn-secondary">Refrescar</button>
        </div>

        {sesiones.length === 0 ? (
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
                        onClick={() => handleEditSesion(sesion)}
                        className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-sm"
                      >
                        <Save size={16} />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => navigate(`/transferencia/${sesion.id}`)}
                        className="btn-primary flex items-center gap-1.5 px-3 py-2 text-sm"
                      >
                        <Eye size={16} />
                        <span>Ver detalles</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSesionId(sesion.id)
                          setShowForm(true)
                          const listaSel = sesion.transferencias_realizadas || []
                          const nextNumSel = listaSel.length > 0 ? Math.max(...listaSel.map(t => Number(t.numero_secuencial) || 0)) + 1 : 1
                          reset({
                            numero_secuencial: nextNumSel,
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
                        }}
                        className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-sm"
                      >
                        <Plus size={16} />
                        <span>Agregar transf.</span>
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

                  {lista.length > 0 && (
                    <div className="mt-4 overflow-x-auto">
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
                          {lista.map((t) => (
                            <tr key={t.id}>
                              <td className="px-3 py-2">{t.numero_secuencial}</td>
                              <td className="px-3 py-2">{t.donadora_id && donadorasMap[t.donadora_id] ? donadorasMap[t.donadora_id].nombre : '-'}</td>
                              <td className="px-3 py-2">{t.toro || '-'}</td>
                              <td className="px-3 py-2">{t.receptora || '-'}</td>
                              <td className="px-3 py-2">{t.estado || '-'}</td>
                              <td className="px-3 py-2">
                                <div className="flex gap-2">
                                  <button className="text-blue-600 hover:text-blue-800 text-xs" onClick={() => handleEdit({ ...t, sesion_transferencia_id: sesion.id })}>Editar</button>
                                  <button className="text-red-600 hover:text-red-800 text-xs" onClick={() => handleDelete(t.id)}>Eliminar</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}
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
                      onClick={() => handleSelectDonadora(donadora)}
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
