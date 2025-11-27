/**
 * Servicio para gestión de transferencias realizadas
 */
import api from './api'

const transferenciaService = {
  async getAll() {
    const response = await api.get('/transferencia/')
    return response.data
  },

  async getById(id) {
    const response = await api.get(`/transferencia/${id}`)
    return response.data
  },

  async create(data) {
    const response = await api.post('/transferencia/', data)
    return response.data
  },

  async update(id, data) {
    const response = await api.put(`/transferencia/${id}`, data)
    return response.data
  },

  async delete(id) {
    await api.delete(`/transferencia/${id}`)
  }
}

export default transferenciaService
