const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'
const defaultHealth = API_BASE_URL.replace(/\/api\/v1\/?$/, '') || ''
const HEALTH_URL = import.meta.env.VITE_HEALTH_URL || `${defaultHealth}/health`

const check = async () => {
  const response = await fetch(HEALTH_URL, { credentials: 'include' })
  if (!response.ok) {
    throw new Error(`Health check failed (${response.status})`)
  }
  return response.json()
}

export default { check }
