// L'authentification est gérée côté client par l'intercepteur axios (401 → /login).
// Le middleware ne fait aucune vérification de token pour éviter la désynchronisation
// entre localStorage (utilisé par axios) et les cookies (accessibles server-side).
export { } from 'next/server'

export const config = {
  matcher: [],
}
