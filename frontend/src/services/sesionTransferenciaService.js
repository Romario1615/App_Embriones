import api from './api'

const basePath = '/sesion-transferencia'

const getAll = (params = {}) => api.get(basePath, { params }).then(res => res.data)
const getById = (id) => api.get(`${basePath}/${id}`).then(res => res.data)
const create = (data) => api.post(basePath, data).then(res => res.data)
const update = (id, data) => api.put(`${basePath}/${id}`, data).then(res => res.data)
const remove = (id) => api.delete(`${basePath}/${id}`).then(res => res.data)

export default {
  getAll,
  getById,
  create,
  update,
  remove
}
