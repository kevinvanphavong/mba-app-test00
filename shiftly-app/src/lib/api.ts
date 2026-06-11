import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/ld+json' },
  // Le JWT vit dans un cookie httpOnly posé par le backend : on l'envoie
  // automatiquement (cross-origin), le JS n'y touche jamais (anti-XSS).
  withCredentials: true,
})

// Protection CSRF par en-tête custom : un site tiers ne peut pas l'ajouter en
// cross-origin (le CORS n'autorise que notre front). On le met sur les mutations.
const MUTATIONS = ['post', 'put', 'patch', 'delete']
api.interceptors.request.use((config) => {
  if (config.method && MUTATIONS.includes(config.method.toLowerCase())) {
    config.headers['X-CSRF'] = '1'
  }
  return config
})

// Auto-logout sur 401 (cookie expiré/invalide) — plus rien à nettoyer côté JS.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      const onPublic = ['/login', '/'].includes(window.location.pathname)
      if (!onPublic) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api

/**
 * Télécharge un binaire (PDF / CSV…) authentifié par le cookie httpOnly.
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
