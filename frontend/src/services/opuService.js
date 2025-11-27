/**
 * Servicio para gestión de sesiones OPU
 */
import api from './api'

const opuService = {
  /**
   * Obtener todas las sesiones OPU
   */
  async getAll() {
    const response = await api.get('/opu/')
    return response.data
  },

  /**
   * Obtener una sesión OPU por ID
   */
  async getById(id) {
    const response = await api.get(`/opu/${id}`)
    return response.data
  },

  /**
   * Crear nueva sesión OPU
   */
  async create(opuData) {
    const response = await api.post('/opu/', opuData)
    return response.data
  },

  /**
   * Actualizar sesión OPU
   */
  async update(id, data) {
    const response = await api.put(`/opu/${id}`, data)
    return response.data
  },

  /**
   * Eliminar sesión OPU
   */
  async delete(id) {
    await api.delete(`/opu/${id}`)
  }
}

export default opuService
