import { useEffect, useMemo, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Plus, Save, Eye, X, Trash2, Search, XCircle, Calendar, User } from 'lucide-react'
import { useOPUStore } from '../store/opuStore'
import opuService from '../services/opuService'
import donadoraService from '../services/donadoraService'

const emptyExtraccion = {
  numero_secuencial: 1,
  hora_extraccion: '',
  donadora: null,
  donadora_id: null,
  toro: '',
  raza_toro: '',
  grado_1: 0,
  grado_2: 0,
  grado_3: 0,
  desnudos: 0,
  irregular: 0,
  nueva: false,
  nueva_nombre: '',
  nueva_registro: '',
  nueva_raza: '',
  nueva_tipo_ganado: '',
  nueva_propietario: ''
}

const calcTotalViables = (ext) =>
  (Number(ext.grado_1) || 0) +
  (Number(ext.grado_2) || 0) +
  (Number(ext.grado_3) || 0) +
  (Number(ext.desnudos) || 0)

export default function OPUPage() {
  const navigate = useNavigate()
  const { sesiones, setSesiones, addSesion, updateSesion, removeSesion } = useOPUStore()
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [extracciones, setExtracciones] = useState([])
  const [extrForm, setExtrForm] = useState({ ...emptyExtraccion })
  const [editingRowIndex, setEditingRowIndex] = useState(null)
  const [donadorasList, setDonadorasList] = useState([])
  const [donadoraSearch, setDonadoraSearch] = useState('')
  const [showDonadoraModal, setShowDonadoraModal] = useState(false)
  const [sessionCollapsed, setSessionCollapsed] = useState(false)
  const isSubmittingRef = useRef(false)

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      fecha: '',
      tecnico_opu: '',
      tecnico_busqueda: '',
      cliente: '',
      medio: '',
      hacienda: '',
      lote: '',
      finalidad: 'fresco',
      observaciones: ''
    }
  })
  const formValues = watch()

  useEffect(() => {
    loadSesiones()
    loadDonadoras()
  }, [])

  const loadSesiones = async () => {
    try {
      const data = await opuService.getAll()
      setSesiones(data || [])
    } catch (error) {
      console.error('Error cargando sesiones OPU:', error)
    }
  }

  const loadDonadoras = async () => {
    try {
      const response = await donadoraService.getAll({ limit: 1000, activo: true })
      const donadoras = response.donadoras || []
      setDonadorasList(donadoras)
      return donadoras
    } catch (error) {
      console.error('Error cargando donadoras:', error)
      return []
    }
  }

  const filteredDonadoras = useMemo(() => {
    const term = donadoraSearch.trim().toLowerCase()
    if (!term) return donadorasList
    return donadorasList.filter(d =>
      `${d.nombre} ${d.numero_registro}`.toLowerCase().includes(term)
    )
  }, [donadoraSearch, donadorasList])

  const startNewSession = () => {
    reset()
    setExtracciones([])
    setExtrForm({ ...emptyExtraccion })
    setEditingId(null)
    setEditingRowIndex(null)
    setShowForm(true)
    setSessionCollapsed(false)
  }

  const handleCancelEdit = () => {
    reset()
    setExtracciones([])
    setExtrForm({ ...emptyExtraccion })
    setEditingId(null)
    setEditingRowIndex(null)
    setShowForm(false)
    setSessionCollapsed(false)
  }

  const handleSelectDonadora = (donadora) => {
    setExtrForm((prev) => ({
      ...prev,
      donadora,
      donadora_id: donadora?.id ?? null,
      nueva: false,
      nueva_nombre: '',
      nueva_registro: '',
      nueva_raza: '',
      nueva_tipo_ganado: '',
      nueva_propietario: ''
    }))
    setShowDonadoraModal(false)
  }

  const addExtraccion = () => {
    const isNueva = extrForm.nueva

    if (!isNueva && !extrForm.donadora_id) {
      alert('Selecciona una donadora del listado')
      return
    }

    if (isNueva) {
      if (
        !extrForm.nueva_nombre ||
        !extrForm.nueva_registro ||
        !extrForm.nueva_raza ||
        !extrForm.nueva_tipo_ganado ||
        !extrForm.nueva_propietario
      ) {
        alert('Completa los datos de la nueva donadora')
        return
      }
    }

    const newRow = {
      numero_secuencial: Number(extrForm.numero_secuencial) || extracciones.length + 1,
      hora_extraccion: extrForm.hora_extraccion || '',
      toro: extrForm.toro || '',
      raza_toro: extrForm.raza_toro || '',
      grado_1: Number(extrForm.grado_1) || 0,
      grado_2: Number(extrForm.grado_2) || 0,
      grado_3: Number(extrForm.grado_3) || 0,
      desnudos: Number(extrForm.desnudos) || 0,
      irregular: Number(extrForm.irregular) || 0,
      nueva: isNueva,
      donadora: isNueva ? null : extrForm.donadora,
      donadora_id: isNueva ? null : (extrForm.donadora_id || extrForm.donadora?.id || null),
      nueva_nombre: extrForm.nueva_nombre || '',
      nueva_registro: extrForm.nueva_registro || '',
      nueva_raza: extrForm.nueva_raza || '',
      nueva_tipo_ganado: extrForm.nueva_tipo_ganado || '',
      nueva_propietario: extrForm.nueva_propietario || ''
    }

    let updated = [...extracciones]
    if (editingRowIndex !== null) {
      updated[editingRowIndex] = newRow
    } else {
      updated.push(newRow)
    }

    updated = updated.map((row, idx) => ({ ...row, numero_secuencial: idx + 1 }))

    setExtracciones(updated)
    setExtrForm({ ...emptyExtraccion, numero_secuencial: updated.length + 1 })
    setEditingRowIndex(null)
  }

  const editExtraccion = (index) => {
    const ext = extracciones[index]
    setExtrForm({
      ...ext,
      numero_secuencial: ext.numero_secuencial || index + 1
    })
    setEditingRowIndex(index)
  }

  const removeExtraccionRow = (index) => {
    const updated = extracciones
      .filter((_, i) => i !== index)
      .map((ext, idx) => ({ ...ext, numero_secuencial: idx + 1 }))
    setExtracciones(updated)
    setExtrForm({ ...emptyExtraccion, numero_secuencial: updated.length + 1 })
    setEditingRowIndex(null)
  }

  const mapExtraccionesFromApi = (list, donas = donadorasList) => {
    return (list || []).map((ext, idx) => {
      const found = donas.find(d => d.id === ext.donadora_id)
      return {
        numero_secuencial: ext.numero_secuencial || idx + 1,
        hora_extraccion: ext.hora_extraccion || '',
        toro: ext.toro || '',
        raza_toro: ext.raza_toro || '',
        grado_1: ext.grado_1 ?? 0,
        grado_2: ext.grado_2 ?? 0,
        grado_3: ext.grado_3 ?? 0,
        desnudos: ext.desnudos ?? 0,
        irregular: ext.irregular ?? 0,
        nueva: false,
        donadora: found || (ext.donadora_id ? { id: ext.donadora_id, nombre: `ID ${ext.donadora_id}`, numero_registro: '-' } : null),
        donadora_id: ext.donadora_id || found?.id || null,
        nueva_nombre: '',
        nueva_registro: '',
        nueva_raza: '',
        nueva_tipo_ganado: '',
        nueva_propietario: ''
      }
    })
  }

  const handleEditSesion = async (sesion) => {
    // Asegurar donadoras cargadas antes de mapear
    let donas = donadorasList
    if (!donas || donas.length === 0) {
      donas = await loadDonadoras()
    }

    // Obtener datos frescos de la sesión (incluye extracciones completas)
    let detail = sesion
    try {
      detail = await opuService.getById(sesion.id)
    } catch (err) {
      console.warn('No se pudo refrescar sesion, usando cache', err)
    }

    setEditingId(detail.id)
    reset({
      fecha: detail.fecha?.split('T')[0] || detail.fecha || '',
      tecnico_opu: detail.tecnico_opu || '',
      tecnico_busqueda: detail.tecnico_busqueda || '',
      cliente: detail.cliente || '',
      medio: detail.medio || '',
      hacienda: detail.hacienda || '',
      lote: detail.lote || '',
      finalidad: detail.finalidad || 'fresco',
      observaciones: detail.observaciones || ''
    })

    const extrList = detail.extracciones || detail.extracciones_donadoras || []
    const mapped = mapExtraccionesFromApi(extrList, donas)
    setExtracciones(mapped)
    setExtrForm({ ...emptyExtraccion, numero_secuencial: mapped.length + 1 })
    setEditingRowIndex(null)
    setShowForm(true)
    setSessionCollapsed(false)
  }

  const onSubmit = async (data) => {
    // Prevenir envíos concurrentes (doble clic)
    if (isSubmittingRef.current) {
      console.warn('Ya hay un envío en progreso, ignorando...')
      return
    }

    if (extracciones.length === 0) {
      alert('Agrega al menos una extraccion por donadora')
      return
    }

    isSubmittingRef.current = true
    setLoading(true)
    try {
      const payload = {
        ...data,
        extracciones: extracciones.map((ext) => {
          const base = {
            numero_secuencial: Number(ext.numero_secuencial) || 0,
            hora_extraccion: ext.hora_extraccion || null,
            toro: ext.toro?.trim() || null,
            raza_toro: ext.raza_toro?.trim() || null,
            grado_1: Number(ext.grado_1) || 0,
            grado_2: Number(ext.grado_2) || 0,
            grado_3: Number(ext.grado_3) || 0,
            desnudos: Number(ext.desnudos) || 0,
            irregular: Number(ext.irregular) || 0
          }

          if (ext.nueva) {
            base.nueva_donadora = {
              nombre: ext.nueva_nombre,
              numero_registro: ext.nueva_registro,
              raza: ext.nueva_raza,
              tipo_ganado: ext.nueva_tipo_ganado,
              propietario_nombre: ext.nueva_propietario
            }
          } else {
            base.donadora_id = ext.donadora_id || ext.donadora?.id
          }

          return base
        })
      }

      if (!payload.medio) delete payload.medio
      if (!payload.hacienda) delete payload.hacienda
      if (!payload.lote) delete payload.lote
      if (!payload.observaciones) delete payload.observaciones

      let saved
      if (editingId) {
        saved = await opuService.update(editingId, payload)
        updateSesion(editingId, saved)
      } else {
        saved = await opuService.create(payload)
        addSesion(saved)
      }

      // Refresh donadoras in case se creó una nueva en el flujo
      const donas = await loadDonadoras()
      const extrList = saved.extracciones || saved.extracciones_donadoras || []
      const mapped = mapExtraccionesFromApi(extrList, donas)
      setExtracciones(mapped)
      setExtrForm({ ...emptyExtraccion, numero_secuencial: mapped.length + 1 })
      setEditingRowIndex(null)
      setEditingId(saved.id)
      setSessionCollapsed(true)
      setShowForm(true)

      alert(editingId ? 'Sesion OPU actualizada' : 'Sesion OPU creada')
    } catch (error) {
      console.error('Error guardando sesion OPU:', error)
      const detail = error.response?.data?.detail
      const message = Array.isArray(detail)
        ? detail.map(d => d.msg || d.detail || JSON.stringify(d)).join(' | ')
        : (detail || error.message)
      alert('Error al guardar sesion OPU: ' + message)
    } finally {
      setLoading(false)
      isSubmittingRef.current = false
    }
  }

  const handleDeleteSesion = async (id) => {
    const confirmed = window.confirm('Eliminar sesion OPU?')
    if (!confirmed) return
    try {
      await opuService.delete(id)
      removeSesion(id)
      if (editingId === id) {
        handleCancelEdit()
      }
    } catch (error) {
      console.error('Error eliminando sesion OPU:', error)
      alert('No se pudo eliminar la sesion')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Modulo OPU</h1>
          <p className="text-gray-600">Gestiona sesiones y las extracciones por donadora</p>
        </div>
        <button
          onClick={() => showForm ? handleCancelEdit() : startNewSession()}
          className="btn-primary flex items-center space-x-2 self-start md:self-center"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          <span>{showForm ? 'Cerrar formulario' : 'Nueva sesion OPU'}</span>
        </button>
      </div>

      {showForm && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Datos de la sesion</h2>
                <p className="text-sm text-gray-600">Completa los datos generales antes de guardar</p>
              </div>
              <div className="flex items-center gap-3">
                {editingId && <span className="text-sm text-gray-500">Editando sesion #{editingId}</span>}
                <button
                  type="button"
                  onClick={() => setSessionCollapsed(!sessionCollapsed)}
                  className="btn-secondary"
                >
                  {sessionCollapsed ? 'Editar datos' : 'Contraer datos'}
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {!sessionCollapsed && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                      <input type="date" {...register('fecha', { required: 'Requerido' })} className="input-field" />
                      {errors.fecha && <p className="text-sm text-red-500 mt-1">{errors.fecha.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tecnico OPU *</label>
                      <input {...register('tecnico_opu', { required: 'Requerido' })} className="input-field" />
                      {errors.tecnico_opu && <p className="text-sm text-red-500 mt-1">{errors.tecnico_opu.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tecnico busqueda *</label>
                      <input {...register('tecnico_busqueda', { required: 'Requerido' })} className="input-field" />
                      {errors.tecnico_busqueda && <p className="text-sm text-red-500 mt-1">{errors.tecnico_busqueda.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                      <input {...register('cliente', { required: 'Requerido' })} className="input-field" />
                      {errors.cliente && <p className="text-sm text-red-500 mt-1">{errors.cliente.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Finalidad *</label>
                      <select {...register('finalidad', { required: true })} className="input-field">
                        <option value="fresco">Fresco</option>
                        <option value="vitrificado">Vitrificado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Medio</label>
                      <input {...register('medio')} className="input-field" placeholder="Ej: Ensolando" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hacienda</label>
                      <input {...register('hacienda')} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lote</label>
                      <input {...register('lote')} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Receptoras</label>
                      <input
                        type="number"
                        {...register('receptoras')}
                        className="input-field"
                        placeholder="Número de receptoras"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                    <textarea {...register('observaciones')} className="input-field" rows={3} />
                  </div>
                </>
              )}

              {sessionCollapsed && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                  <div>
                    <p className="font-medium text-gray-800">Fecha</p>
                    <p>{formValues?.fecha || ''}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Cliente</p>
                    <p>{formValues?.cliente || ''}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Finalidad</p>
                    <p className="capitalize">{formValues?.finalidad || ''}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Tecnico OPU</p>
                    <p>{formValues?.tecnico_opu || ''}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Tecnico busqueda</p>
                    <p>{formValues?.tecnico_busqueda || ''}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save size={18} />
                  <span>{loading ? 'Guardando...' : editingId ? 'Actualizar sesion' : 'Guardar sesion'}</span>
                </button>
                <button type="button" onClick={handleCancelEdit} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Extraccion por donadora</h3>
                <p className="text-sm text-gray-600">Usa un solo formulario y agrega cada donadora a la lista</p>
              </div>
              {editingRowIndex !== null && (
                <button
                  type="button"
                  onClick={() => {
                    setExtrForm({ ...emptyExtraccion, numero_secuencial: extracciones.length + 1 })
                    setEditingRowIndex(null)
                  }}
                  className="btn-secondary"
                >
                  Cancelar edicion
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secuencia</label>
                <input
                  type="number"
                  value={extrForm.numero_secuencial}
                  onChange={(e) => setExtrForm({ ...extrForm, numero_secuencial: e.target.value })}
                  className="input-field"
                  min={1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                <input
                  type="time"
                  value={extrForm.hora_extraccion}
                  onChange={(e) => setExtrForm({ ...extrForm, hora_extraccion: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Toro</label>
                <input
                  value={extrForm.toro}
                  onChange={(e) => setExtrForm({ ...extrForm, toro: e.target.value })}
                  className="input-field"
                  placeholder="Nombre o codigo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Raza del toro</label>
                <input
                  value={extrForm.raza_toro}
                  onChange={(e) => setExtrForm({ ...extrForm, raza_toro: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Donadora *</label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDonadoraModal(true)}
                    className="btn-secondary flex items-center space-x-2"
                    disabled={extrForm.nueva}
                  >
                    <Search size={16} />
                    <span>Elegir del listado</span>
                  </button>
                  {extrForm.donadora && !extrForm.nueva && (
                    <span className="inline-flex items-center bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                      {extrForm.donadora.nombre} ({extrForm.donadora.numero_registro})
                      <button
                        type="button"
                        onClick={() => setExtrForm({ ...extrForm, donadora: null, donadora_id: null })}
                        className="ml-2 text-primary hover:text-primary-dark"
                      >
                        <XCircle size={16} />
                      </button>
                    </span>
                  )}
                </div>

                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={extrForm.nueva}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setExtrForm({
                        ...extrForm,
                        nueva: checked,
                        donadora: checked ? null : extrForm.donadora,
                        donadora_id: checked ? null : extrForm.donadora_id
                      })
                    }}
                  />
                  <span>Registrar nueva donadora (si no existe en el listado)</span>
                </label>

                {extrForm.nueva && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
                      <input
                        value={extrForm.nueva_nombre}
                        onChange={(e) => setExtrForm({ ...extrForm, nueva_nombre: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Numero registro *</label>
                      <input
                        value={extrForm.nueva_registro}
                        onChange={(e) => setExtrForm({ ...extrForm, nueva_registro: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Raza *</label>
                      <input
                        value={extrForm.nueva_raza}
                        onChange={(e) => setExtrForm({ ...extrForm, nueva_raza: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de ganado *</label>
                      <select
                        value={extrForm.nueva_tipo_ganado}
                        onChange={(e) => setExtrForm({ ...extrForm, nueva_tipo_ganado: e.target.value })}
                        className="input-field"
                      >
                        <option value="">Seleccionar</option>
                        <option value="carne">Carne</option>
                        <option value="leche">Leche</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Propietario *</label>
                      <input
                        value={extrForm.nueva_propietario}
                        onChange={(e) => setExtrForm({ ...extrForm, nueva_propietario: e.target.value })}
                        className="input-field"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GI</label>
                  <input
                    type="number"
                    min={0}
                    value={extrForm.grado_1}
                    onChange={(e) => setExtrForm({ ...extrForm, grado_1: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GII</label>
                  <input
                    type="number"
                    min={0}
                    value={extrForm.grado_2}
                    onChange={(e) => setExtrForm({ ...extrForm, grado_2: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GIII</label>
                  <input
                    type="number"
                    min={0}
                    value={extrForm.grado_3}
                    onChange={(e) => setExtrForm({ ...extrForm, grado_3: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desnudos</label>
                  <input
                    type="number"
                    min={0}
                    value={extrForm.desnudos}
                    onChange={(e) => setExtrForm({ ...extrForm, desnudos: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Irregular</label>
                  <input
                    type="number"
                    min={0}
                    value={extrForm.irregular}
                    onChange={(e) => setExtrForm({ ...extrForm, irregular: e.target.value })}
                    className="input-field"
                  />
                  <p className="text-xs text-gray-500 mt-1">No se suma al total</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Total viables (sin irregular)</p>
                  <p className="text-xl font-semibold text-gray-800">{calcTotalViables(extrForm)}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="button" onClick={addExtraccion} className="btn-primary flex items-center space-x-2">
                <Save size={16} />
                <span>{editingRowIndex !== null ? 'Actualizar extraccion' : 'Agregar extraccion'}</span>
              </button>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Lista de extracciones</h3>
              <p className="text-sm text-gray-600">Edita o elimina desde esta tabla</p>
            </div>

            {extracciones.length === 0 ? (
              <p className="text-gray-600 text-center py-6">Aun no agregas extracciones</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Hora</th>
                      <th className="px-3 py-2 text-left">Donadora</th>
                      <th className="px-3 py-2 text-left">Toro</th>
                      <th className="px-3 py-2 text-left">GI</th>
                      <th className="px-3 py-2 text-left">GII</th>
                      <th className="px-3 py-2 text-left">GIII</th>
                      <th className="px-3 py-2 text-left">Desnudos</th>
                      <th className="px-3 py-2 text-left">Irregular</th>
                      <th className="px-3 py-2 text-left">Total viables</th>
                      <th className="px-3 py-2 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {extracciones.map((ext, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{ext.numero_secuencial}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{ext.hora_extraccion || '-'}</td>
                        <td className="px-3 py-2">
                          {ext.nueva
                            ? '(Nueva donadora)'
                            : ext.donadora
                              ? `${ext.donadora.nombre} (${ext.donadora.numero_registro})`
                              : `ID ${ext.donadora_id}`}
                        </td>
                        <td className="px-3 py-2">
                          {ext.toro || '-'}
                          {ext.raza_toro ? ` / ${ext.raza_toro}` : ''}
                        </td>
                        <td className="px-3 py-2">{ext.grado_1}</td>
                        <td className="px-3 py-2">{ext.grado_2}</td>
                        <td className="px-3 py-2">{ext.grado_3}</td>
                        <td className="px-3 py-2">{ext.desnudos}</td>
                        <td className="px-3 py-2">{ext.irregular}</td>
                        <td className="px-3 py-2 font-semibold">{calcTotalViables(ext)}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => editExtraccion(idx)}
                              className="text-primary hover:text-primary-dark text-sm"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => removeExtraccionRow(idx)}
                              className="text-red-500 hover:text-red-600 text-sm"
                            >
                              Eliminar
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
        </div>
      )}

      {!showForm && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Sesiones OPU</h2>
            <button onClick={loadSesiones} className="btn-secondary">Refrescar</button>
          </div>

          {sesiones.length === 0 ? (
            <p className="text-gray-600 text-center py-6">No hay sesiones registradas</p>
          ) : (
            <div className="space-y-4">
              {sesiones.map((sesion) => {
                const extracciones = sesion.extracciones || sesion.extracciones_donadoras || []
                const totalExtracciones = extracciones.length
                const totalViables = extracciones.reduce((sum, ext) => {
                  return sum + (Number(ext.grado_1) || 0) + (Number(ext.grado_2) || 0) +
                         (Number(ext.grado_3) || 0) + (Number(ext.desnudos) || 0)
                }, 0)
                const totalIrregular = extracciones.reduce((sum, ext) => sum + (Number(ext.irregular) || 0), 0)
                const totalOvocitos = totalViables + totalIrregular
                const tasaViabilidad = totalOvocitos > 0 ? ((totalViables / totalOvocitos) * 100).toFixed(0) : 0

                return (
                  <div
                    key={sesion.id}
                    className="border-2 border-blue-200 rounded-xl p-5 bg-gradient-to-br from-white to-blue-50/30 hover:shadow-lg transition-all duration-300 hover:border-blue-300"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-xl shadow-md">
                          <Calendar className="text-white" size={24} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-gray-900">
                              {sesion.fecha ? new Date(sesion.fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Sin fecha'}
                            </h3>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-semibold">
                              ID: {sesion.id}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <User size={14} />
                              <span className="font-medium">{sesion.tecnico_opu}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>•</span>
                              <span className="font-medium">{sesion.cliente}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>•</span>
                              <span className="capitalize bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs font-semibold">
                                {sesion.finalidad}
                              </span>
                            </div>
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
                          onClick={() => navigate(`/opu/${sesion.id}`)}
                          className="btn-primary flex items-center gap-1.5 px-3 py-2 text-sm"
                        >
                          <Eye size={16} />
                          <span>Ver Detalles</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSesion(sesion.id)}
                          className="px-3 py-2 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg border border-red-200 transition-colors flex items-center gap-1.5 font-medium"
                        >
                          <Trash2 size={16} />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="bg-white/70 rounded-lg p-3 border border-blue-100">
                        <p className="text-xs text-blue-700 font-semibold uppercase mb-1">Extracciones</p>
                        <p className="text-2xl font-bold text-blue-900">{totalExtracciones}</p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-3 border border-green-100">
                        <p className="text-xs text-green-700 font-semibold uppercase mb-1">Viables</p>
                        <p className="text-2xl font-bold text-green-900">{totalViables}</p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-3 border border-red-100">
                        <p className="text-xs text-red-700 font-semibold uppercase mb-1">Irregulares</p>
                        <p className="text-2xl font-bold text-red-900">{totalIrregular}</p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-3 border border-purple-100">
                        <p className="text-xs text-purple-700 font-semibold uppercase mb-1">Total Ovocitos</p>
                        <p className="text-2xl font-bold text-purple-900">{totalOvocitos}</p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-3 border border-indigo-100">
                        <p className="text-xs text-indigo-700 font-semibold uppercase mb-1">Viabilidad</p>
                        <p className="text-2xl font-bold text-indigo-900">{tasaViabilidad}%</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

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
                      className="w-full text-left px-3 py-2 hover:bg-gray-50"
                    >
                      <p className="font-medium text-gray-800">{donadora.nombre}</p>
                      <p className="text-sm text-gray-600">Registro {donadora.numero_registro} - {donadora.raza}</p>
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
