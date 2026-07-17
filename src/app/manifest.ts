import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'проЯв — галереї, сайти і бронювання для фотографів',
    short_name: 'проЯв',
    description:
      'Передавайте зйомки клієнтам у красивих галереях, збирайте персональний сайт і приймайте оплати напряму на картку.',
    start_url: '/uk',
    display: 'standalone',
    background_color: '#f4f4f1',
    theme_color: '#2f55ff',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  }
}
