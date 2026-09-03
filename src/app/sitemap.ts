import type { MetadataRoute } from 'next'

export const revalidate = 3600 // cache for 1 hour
export const dynamic = 'force-static'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://jobgenie.fun'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const lastModified = now.toISOString()

  const routes: string[] = [
    '/',
    '/privacy',
    '/terms',
    '/refund',
    '/login',
    '/auth/signin',
    '/auth/signup',
  ]

  return routes.map((path) => ({
    url: new URL(path, SITE).toString(),
    lastModified,
    changeFrequency: 'weekly',
    priority: path === '/' ? 1 : 0.6,
  }))
}
