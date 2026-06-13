import { NextResponse } from 'next/server'

/**
 * Le cookie d'auth (httpOnly) est posé pour le domaine de l'API (Railway), pas
 * pour celui du front (Vercel) — domaines racine différents. Le middleware, qui
 * tourne sur le domaine du front, ne peut donc PAS le lire : tout garde-fou basé
 * sur ce cookie ici boucle (l'utilisateur connecté est vu comme déconnecté).
 *
 * → Le gating d'auth est entièrement CÔTÉ CLIENT : `useCurrentUser`/`/api/me`
 *   (cookie envoyé en cross-site) + l'intercepteur 401 de lib/api.ts qui redirige
 *   vers /login. L'API reste la vraie barrière de sécurité (cookie + voters).
 *
 * Ce middleware se contente donc de laisser passer. Conservé (plutôt que supprimé)
 * pour documenter ce choix et garder un point d'extension futur (ex : i18n, headers).
 */
export function middleware() {
  return NextResponse.next()
}

export const config = {
  // Exclure les assets statiques Next.js, images et fichiers avec extension
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
