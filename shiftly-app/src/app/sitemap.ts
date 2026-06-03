import type { MetadataRoute } from 'next'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://shiftly.fr'

// Sitemap minimal — uniquement la landing et ses pages légales publiques.
// Les routes /service, /dashboard, etc. sont privées et exclues du sitemap.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return [
    { url: `${SITE}/`, lastModified, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE}/cgu`, lastModified, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE}/confidentialite`, lastModified, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE}/mentions-legales`, lastModified, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
