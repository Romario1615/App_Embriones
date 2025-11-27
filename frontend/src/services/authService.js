/**
 * Servicio de autenticación
 */
import api from './api'

const authService = {
  /**
   * Login de usuario
   */
  async login(usuario, password) {
    // FastAPI OAuth2PasswordRequestForm espera form-data
    const formData = new FormData()
    formData.append('username', usuario)
    formData.append('password', password)

    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    return response.data
  },

  /**
   * Obtener usuario actual
   */
  async getCurrentUser() {
    const response = await api.get('/auth/me')
    return response.data
  },

  /**
   * Logout
   */
  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}

export default authService
