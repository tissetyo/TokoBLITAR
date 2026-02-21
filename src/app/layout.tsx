import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/Providers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'TokoBLITAR — Marketplace UMKM Kabupaten Blitar',
  description:
    'Platform marketplace untuk UMKM di Kabupaten Blitar. Jual beli produk lokal, kelola toko online, dan sinkronisasi ke marketplace utama.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={inter.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
