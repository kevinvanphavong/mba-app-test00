import axios from 'axios'

/**
 * Base de l'API. Le site public est résolu par le HOST côté back : on doit donc
 * appeler l'API sur le MÊME host que le navigateur (multi-tenant par domaine, y
 * compris `*.localhost` en dev). Si `NEXT_PUBLIC_API_URL` est défini (prod), il prime.
 */
function resolveApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8000/api`
  }
  return 'http://localhost:8000/api'
}

const api = axios.create({
  baseURL: resolveApiBase(),
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

// Auto-logout sur 401 (cookie expiré/invalide). On demande au backend d'expirer
// le cookie httpOnly (le JS ne peut pas l'effacer lui-même) avant de rediriger —
// ça évite toute boucle de redirection sur un cookie périmé.
let clearing = false
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      const onPublic = ['/login', '/'].includes(window.location.pathname)
      const isLogout = (err.config?.url ?? '').includes('/auth/logout')
      if (!onPublic && !isLogout && !clearing) {
        clearing = true
        try { await api.post('/auth/logout') } catch { /* best-effort */ }
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
