import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://cliniq-blond-nu.vercel.app'
  
  // Static routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/archives`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ]

  // Dynamic routes (published cases)
  const today = new Date().toISOString().split('T')[0]
  const { data: cases } = await supabase
    .from('cases')
    .select('id, publish_date')
    .eq('status', 'published')
    .lte('publish_date', today)

  if (cases) {
    cases.forEach((c) => {
      routes.push({
        url: `${baseUrl}/archives/${c.id}`,
        lastModified: new Date(c.publish_date),
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    })
  }

  return routes
}
