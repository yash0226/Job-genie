import type { MetadataRoute } from 'next'

export const revalidate = 3600 // cache for 1 hour

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://jobgenie.fun'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${SITE}/sitemap.xml`,
  }
}
