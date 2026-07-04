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
 * Auth (défense en profondeur) : sur les hosts plateforme, si le cookie d'auth est
 * ABSENT sur une route privée → redirect login. Simple test de présence (pas de
 * vérification de signature en edge) ; l'API reste la vraie barrière (cookie + voters).
 */

/** Préfixes des routes privées de l'app gérant (groupe `(app)`). */
const APP_ROUTES = [
  '/dashboard', '/planning', '/pointage', '/postes', '/reglages', '/service', '/services',
  '/staff', '/tutoriels', '/haccp', '/reservations', '/demandes', '/contacts', '/avis',
  '/relances', '/mon-site',
]

function isAppRoute(pathname: string): boolean {
  return APP_ROUTES.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

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
  const { pathname } = request.nextUrl

  // Host plateforme (ou dev localhost) → routage normal + gating auth des routes privées.
  if (isPlatformHost(host)) {
    // Super-admin (hors login) : cookie sa_token requis.
    if (pathname.startsWith('/superadmin') && pathname !== '/superadmin/login' && !request.cookies.has('sa_token')) {
      return NextResponse.redirect(new URL('/superadmin/login', request.url))
    }
    // App gérant : cookie token requis.
    if (isAppRoute(pathname) && !request.cookies.has('token')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // Domaine client : déjà dans l'espace public → laisser passer.
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
