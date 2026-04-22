import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes accessibles sans authentification (app classique)
const PUBLIC_PATHS = ['/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Les routes SuperAdmin gèrent leur propre auth — le middleware n'y touche pas
  if (pathname.startsWith('/superadmin')) {
    return NextResponse.next()
  }

  const token = request.cookies.get('token')?.value

  // Déjà connecté et accède à /login → rediriger vers /service
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/service', request.url))
  }

  // Non connecté et accède à une route protégée → rediriger vers /login
  if (!PUBLIC_PATHS.includes(pathname) && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Exclure les assets statiques Next.js, images et fichiers avec extension
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
