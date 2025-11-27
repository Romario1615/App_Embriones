/**
 * Servicio para gestión de donadoras
 */
import api from './api'

const donadoraService = {
  /**
   * Obtener todas las donadoras
   */
  async getAll() {
    const response = await api.get('/donadoras/')
    return response.data
  },

  /**
   * Buscar donadoras por texto
   */
  async search(query) {
    const response = await api.get('/donadoras/', { params: { q: query } })
    return response.data
  },

  /**
   * Obtener una donadora por ID
   */
  async getById(id) {
    const response = await api.get(`/donadoras/${id}`)
    return response.data
  },

  /**
   * Crear nueva donadora
   */
  async create(donadoraData, foto) {
    const formData = new FormData()

    // Añadir todos los campos
    Object.keys(donadoraData).forEach(key => {
      const value = donadoraData[key]
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, donadoraData[key])
      }
    })

    // Añadir foto si existe
    if (foto) {
      formData.append('foto', foto)
    }

    // Don't set Content-Type manually - let Axios set it with the boundary
    const response = await api.post('/donadoras/', formData)

    return response.data
  },

  /**
   * Actualizar donadora
   */
  async update(id, data, foto) {
    const formData = new FormData()

    // Añadir todos los campos
    Object.keys(data).forEach(key => {
      const value = data[key]
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value)
      }
    })

    // Añadir foto si existe
    if (foto) {
      formData.append('foto', foto)
    }

    // Don't set Content-Type manually - let Axios set it with the boundary
    const response = await api.put(`/donadoras/${id}`, formData)

    return response.data
  },

  /**
   * Eliminar donadora
   */
  async delete(id) {
    await api.delete(`/donadoras/${id}`)
  }
}

export default donadoraService
