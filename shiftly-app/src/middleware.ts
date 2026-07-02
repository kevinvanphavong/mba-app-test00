import { NextResponse, type NextRequest } from 'next/server'

/**
 * Routing par domaine (host → espace).
 *
 * Chaque client a, en prod, son PROPRE domaine (`vr-galaxie-nantes.fr`). Ce
 * middleware mappe l'URL selon le HOST :
 *  - Host « plateforme » (marketing / app gérant / admin super-admin, + `localhost`
 *    et `*.localhost` en dev) → routage normal (aucune réécriture).
 *  - Tout autre host = **domaine client** → on ne sert QUE l'espace public : on
 *    **réécrit** (rewrite, pas redirect → l'URL reste propre) `/*` vers `/site/*`.
 *    Les routes internes (`/dashboard`, `/superadmin`, `/login`…) deviennent
 *    `/site/dashboard`… → 404 : elles ne sont jamais atteignables via un domaine client.
 *
 * Le middleware ne résout JAMAIS le centre : il ne fait que mapper l'URL. La
 * résolution du centre reste côté API, par host (404 si domaine inconnu).
 *
 * Auth : inchangée. Le gating reste CÔTÉ CLIENT (`useCurrentUser`/`/api/me` +
 * l'intercepteur 401 de lib/api.ts) ; l'API est la vraie barrière (cookie + voters).
 */

/** Hosts plateforme déclarés en env (jamais en dur), ex. "shiftly.app,app.shiftly.app". */
const PLATFORM_HOSTS = (process.env.NEXT_PUBLIC_PLATFORM_HOSTS ?? '')
  .split(',')
  .map((h) => normalizeHost(h))
  .filter(Boolean)

function normalizeHost(raw: string | null | undefined): string {
  if (!raw) return ''
  const host = raw.toLowerCase().trim()
  const colon = host.indexOf(':')
  return colon === -1 ? host : host.slice(0, colon)
}

/** Un host plateforme = liste env + `localhost` / `*.localhost` (dev). */
function isPlatformHost(host: string): boolean {
  if (host === '' || host === 'localhost' || host.endsWith('.localhost')) {
    return true
  }
  return PLATFORM_HOSTS.includes(host)
}

export function middleware(request: NextRequest) {
  const host = normalizeHost(request.headers.get('host'))

  // Host plateforme (ou dev localhost) → routage normal.
  if (isPlatformHost(host)) {
    return NextResponse.next()
  }

  // Domaine client : déjà dans l'espace public → laisser passer.
  const { pathname } = request.nextUrl
  if (pathname === '/site' || pathname.startsWith('/site/')) {
    return NextResponse.next()
  }

  // Domaine client : réécrire vers l'espace public /site/* (rewrite, pas redirect).
  const url = request.nextUrl.clone()
  url.pathname = '/' === pathname ? '/site' : `/site${pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  // Exclure les assets statiques Next.js, images et fichiers avec extension.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
