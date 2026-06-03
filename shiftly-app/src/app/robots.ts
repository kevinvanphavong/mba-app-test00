import type { MetadataRoute } from 'next'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://shiftly.fr'

// Robots.txt — indexation autorisée sur la landing et les pages légales,
// le reste de l'app (espace authentifié + superadmin) est exclu.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/cgu', '/confidentialite', '/mentions-legales'],
        disallow: [
          '/login',
          '/service',
          '/services',
          '/dashboard',
          '/postes',
          '/staff',
          '/haccp',
          '/tutoriels',
          '/reglages',
          '/pointage',
          '/planning',
          '/validation',
          '/superadmin',
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  }
}
