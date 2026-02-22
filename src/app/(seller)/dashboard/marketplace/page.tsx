'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, ExternalLink } from 'lucide-react'

const PLATFORMS = [
  {
    id: 'google-maps',
    name: 'Google Maps',
    icon: '📍',
    color: '#4285F4',
    tagline: 'Toko muncul di pencarian Google Maps',
    steps: 8,
    href: '/dashboard/marketplace/google-maps',
  },
  {
    id: 'tokopedia',
    name: 'Tokopedia',
    icon: '🟢',
    color: '#42b549',
    tagline: 'Jual di marketplace terbesar Indonesia',
    steps: 8,
    href: '/dashboard/marketplace/tokopedia',
  },
  {
    id: 'shopee',
    name: 'Shopee',
    icon: '🟠',
    color: '#ee4d2d',
    tagline: 'Jangkau jutaan pembeli Shopee',
    steps: 7,
    href: '/dashboard/marketplace/shopee',
  },
  {
    id: 'lazada',
    name: 'Lazada',
    icon: '🔵',
    color: '#0f136d',
    tagline: 'Ekspansi ke Lazada Asia Tenggara',
    steps: 8,
    href: '/dashboard/marketplace/lazada',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    color: '#E4405F',
    tagline: 'Promosikan produk lewat Instagram Business',
    steps: 7,
    href: '/dashboard/marketplace/instagram',
  },
]

export default function MarketplaceHubPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Hubungkan Toko</h1>
        <p className="mt-1 text-sm text-gray-500">
          Daftarkan toko di berbagai platform agar bisa ditemukan lebih banyak pembeli.
          AI akan membantu generate deskripsi, nama, dan konten untuk masing-masing platform.
        </p>
      </div>

      <div className="space-y-3">
        {PLATFORMS.map((platform) => (
          <Link key={platform.id} href={platform.href}>
            <Card className="group cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5">
              <CardContent className="flex items-center gap-4 py-5">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${platform.color}12` }}
                >
                  {platform.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">{platform.name}</h3>
                    <Badge variant="secondary" className="text-[10px]">
                      {platform.steps} langkah
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">{platform.tagline}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-gray-500" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
