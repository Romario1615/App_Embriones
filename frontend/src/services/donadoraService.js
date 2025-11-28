/**
 * Servicio para gestión de donadoras
 */
import api from './api'

const donadoraService = {
  /**
   * Obtener todas las donadoras con filtros y paginación
   */
  async getAll(params = {}) {
    const response = await api.get('/donadoras/', { params })
    return response.data
  },

  /**
   * Obtener estadísticas de donadoras
   */
  async getStatistics() {
    const response = await api.get('/donadoras/stats')
    return response.data
  },

  /**
   * Exportar donadoras a CSV
   */
  async exportCSV(activo = null) {
    const params = {}
    if (activo !== null) {
      params.activo = activo
    }

    const response = await api.get('/donadoras/export/csv', {
      params,
      responseType: 'blob'
    })

    // Crear un enlace temporal para descargar el archivo
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url

    // Obtener el nombre del archivo del header o usar uno por defecto
    const contentDisposition = response.headers['content-disposition']
    let filename = 'donadoras.csv'
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/)
      if (filenameMatch) {
        filename = filenameMatch[1]
      }
    }

    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
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
      // Permitir booleanos (incluido false) y otros valores que no sean null, undefined o string vacío
      if (value !== null && value !== undefined && value !== '' || typeof value === 'boolean') {
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
