import { withSentryConfig } from '@sentry/nextjs'

const isProd = process.env.NODE_ENV === 'production'

// URL de l'API Railway en prod — sert de cible au rewrite same-origin ci-dessous.
const RAILWAY_API = 'https://shiftly-project.up.railway.app'

/**
 * Front (vercel.app) et API (railway.app) ont des domaines racine différents :
 * le cookie d'auth httpOnly est donc « tiers » et bloqué par les navigateurs →
 * /api/me renvoie 401 → boucle de login. On supprime le cross-origin en prod :
 * le front tape `/api/*` (même origine) et Next proxifie vers Railway côté serveur.
 * Le cookie devient first-party (vercel.app), plus de boucle.
 *
 * - Prod  : API relative `/api` + rewrite vers Railway.
 * - Dev   : on tape localhost:8000 directement (pas de rewrite).
 */
const API_URL = isProd ? '/api' : (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api')

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: API_URL,
  },
  async rewrites() {
    if (!isProd) return []
    return [
      {
        source: '/api/:path*',
        destination: `${RAILWAY_API}/api/:path*`,
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  org:     'shiftly-saas',
  project: 'shiftly-app',
  silent:  !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps:        true,
  webpack: {
    treeshake: { removeDebugLogging: true },
  },
})
