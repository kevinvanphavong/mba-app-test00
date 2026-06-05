import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/ld+json' },
})

// Attach JWT on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token')
      document.cookie = 'token=; path=/; max-age=0'
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

/**
 * Télécharge un binaire (PDF / CSV…) en s'authentifiant via l'intercepteur
 * JWT d'axios. Évite d'avoir à passer le token en query string ou de bypass
 * l'auth sur les routes binaires côté Symfony.
 *
 * Force le download via un <a download> temporaire.
 */
export async function downloadBinary(path: string, filename: string): Promise<void> {
  const res = await api.get(path, { responseType: 'blob' })
  const url = window.URL.createObjectURL(res.data as Blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}
