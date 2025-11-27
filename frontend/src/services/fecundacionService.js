/**
 * Servicio para gestión de fecundación (IVF)
 */
import api from './api'

const fecundacionService = {
  async getAll() {
    const response = await api.get('/fecundacion/')
    return response.data
  },

  async getById(id) {
    const response = await api.get(`/fecundacion/${id}`)
    return response.data
  },

  async create(data) {
    const response = await api.post('/fecundacion/', data)
    return response.data
  },

  async update(id, data) {
    const response = await api.put(`/fecundacion/${id}`, data)
    return response.data
  },

  async delete(id) {
    await api.delete(`/fecundacion/${id}`)
  }
}

export default fecundacionService
