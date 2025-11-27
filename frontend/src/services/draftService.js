/**
 * Servicio para gestión de drafts (autosave)
 */
import api from './api'

const draftService = {
  /**
   * Crear o actualizar draft
   */
  async save(modulo, tipoRegistro, datosJson, registroId = null) {
    const response = await api.post('/drafts/', {
      modulo,
      tipo_registro: tipoRegistro,
      registro_id: registroId,
      datos_json: datosJson
    })
    return response.data
  },

  /**
   * Obtener drafts del usuario actual
   */
  async getUserDrafts(modulo = null, tipoRegistro = null) {
    const params = {}
    if (modulo) params.modulo = modulo
    if (tipoRegistro) params.tipo_registro = tipoRegistro

    const response = await api.get('/drafts/', { params })
    return response.data
  },

  /**
   * Eliminar draft
   */
  async delete(draftId) {
    await api.delete(`/drafts/${draftId}`)
  },

  /**
   * Marcar draft como completado
   */
  async markAsCompleted(draftId) {
    await api.post(`/drafts/${draftId}/complete`)
  }
}

export default draftService
