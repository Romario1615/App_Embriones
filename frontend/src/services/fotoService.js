/**
 * Servicio para gestión de fotos múltiples
 */
import api from './api'

const fotoService = {
  /**
   * Subir una foto
   */
  async upload(entidadTipo, entidadId, archivo, orden = 0, descripcion = null) {
    const formData = new FormData()
    formData.append('entidad_tipo', entidadTipo)
    formData.append('entidad_id', entidadId)
    formData.append('orden', orden)
    if (descripcion) {
      formData.append('descripcion', descripcion)
    }
    formData.append('archivo', archivo)

    const response = await api.post('/fotos/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  /**
   * Subir múltiples fotos
   */
  async uploadMultiple(entidadTipo, entidadId, archivos) {
    const promises = archivos.map((archivo, index) =>
      this.upload(entidadTipo, entidadId, archivo, index)
    )
    return Promise.all(promises)
  },

  /**
   * Obtener todas las fotos de una entidad
   */
  async getByEntidad(entidadTipo, entidadId) {
    const response = await api.get(`/fotos/${entidadTipo}/${entidadId}`)
    return response.data
  },

  /**
   * Eliminar una foto
   */
  async delete(fotoId) {
    await api.delete(`/fotos/${fotoId}`)
  },

  /**
   * Eliminar todas las fotos de una entidad
   */
  async deleteAll(entidadTipo, entidadId) {
    await api.delete(`/fotos/${entidadTipo}/${entidadId}`)
  }
}

export default fotoService
