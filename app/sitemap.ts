import { getBaseURL } from '@/lib/utils';
import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
   const baseUrl = getBaseURL();
  return [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
    //   alternates: {
    //     languages: {
    //       es: 'https://acme.com/es',
    //       de: 'https://acme.com/de',
    //     },
    //   },
    },
    {
      url: `${baseUrl}/servicios`,
      lastModified: new Date(),
    //   alternates: {
    //     languages: {
    //       es: 'https://acme.com/es/about',
    //       de: 'https://acme.com/de/about',
    //     },
    //   },
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
    //   alternates: {
    //     languages: {
    //       es: 'https://acme.com/es/blog',
    //       de: 'https://acme.com/de/blog',
    //     },
    //   },
    },
    {
      url: `${baseUrl}/sobre-nosotros`,
      lastModified: new Date(),
    //   alternates: {
    //     languages: {
    //       es: 'https://acme.com/es/blog',
    //       de: 'https://acme.com/de/blog',
    //     },
    //   },
    },
    {
      url: `${baseUrl}/testimonios`,
      lastModified: new Date(),
    //   alternates: {
    //     languages: {
    //       es: 'https://acme.com/es/blog',
    //       de: 'https://acme.com/de/blog',
    //     },
    //   },
    },
    {
      url: `${baseUrl}/preguntas-frecuentes`,
      lastModified: new Date(),
    //   alternates: {
    //     languages: {
    //       es: 'https://acme.com/es/blog',
    //       de: 'https://acme.com/de/blog',
    //     },
    //   },
    },
]
}