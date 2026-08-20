import { NextResponse, type NextRequest } from 'next/server'

/**
 * Gating d'auth (défense en profondeur) — le middleware ne fait QUE ça.
 *
 * Le cookie d'auth httpOnly est first-party : le front tape `/api/*` en same-origin
 * (rewrite vers Railway dans `next.config.mjs` en prod), le cookie est donc posé sur
 * le domaine du front et lisible ici. Sur une route privée sans cookie → redirect
 * login, sans attendre le 401 de l'API.
 *
 * Simple test de PRÉSENCE du cookie (pas de vérification de signature en edge) :
 * l'API reste la vraie barrière (cookie + voters + filtre `centre_id`).
 *
 * NB : **aucun routing par host ici.** Le multi-tenant est résolu côté API — par le
 * JWT, ou par le host pour les surfaces publiques (cf. `CurrentCentreResolver`).
 * Les pages vitrine sont servies telles quelles sous `/site/*`.
 */

/** Préfixes des routes privées de l'app gérant (groupe `(app)`). */
const APP_ROUTES = [
  '/dashboard', '/planning', '/pointage', '/postes', '/reglages', '/service', '/services',
  '/staff', '/tutoriels', '/haccp', '/aide',
]

function isAppRoute(pathname: string): boolean {
  return APP_ROUTES.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

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

export const config = {
  // Exclure l'API (proxifiée vers Railway), les assets Next.js, images et fichiers
  // avec extension. `/api/*` ne doit JAMAIS être intercepté ici.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
