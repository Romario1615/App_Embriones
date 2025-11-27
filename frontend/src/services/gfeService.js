/**
 * Servicio para chequeos GFE
 */
import api from './api'

const gfeService = {
  async getAll() {
    const response = await api.get('/gfe/')
    return response.data
  },

  async getById(id) {
    const response = await api.get(`/gfe/${id}`)
    return response.data
  },

  async create(data) {
    const response = await api.post('/gfe/', data)
    return response.data
  },

  async update(id, data) {
    const response = await api.put(`/gfe/${id}`, data)
    return response.data
  },

  async delete(id) {
    await api.delete(`/gfe/${id}`)
  }
}

export default gfeService
