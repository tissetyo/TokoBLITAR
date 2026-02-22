'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  MapPin,
  ShoppingBag,
  Instagram,
  Copy,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'

interface PlatformGuide {
  id: string
  name: string
  icon: string
  color: string
  tagline: string
  registerUrl: string
  steps: {
    title: string
    description: string
    tip?: string
    link?: { label: string; url: string }
  }[]
}

const PLATFORMS: PlatformGuide[] = [
  {
    id: 'google-maps',
    name: 'Google Maps',
    icon: '📍',
    color: '#4285F4',
    tagline: 'Agar toko kamu muncul di Google Maps ketika orang mencari',
    registerUrl: 'https://business.google.com',
    steps: [
      {
        title: 'Buka Google Business Profile',
        description: 'Kunjungi Google Business Profile dan klik "Kelola sekarang". Login dengan akun Google kamu.',
        link: { label: 'Buka Google Business Profile', url: 'https://business.google.com' },
      },
      {
        title: 'Masukkan nama usaha',
        description: 'Ketik nama toko kamu persis seperti di TokoBLITAR. Contoh: "Toko Oleh-Oleh Blitar". Jika belum ada, pilih "Tambahkan bisnis Anda ke Google".',
        tip: 'Gunakan nama yang sama supaya konsisten di semua platform.',
      },
      {
        title: 'Pilih kategori bisnis',
        description: 'Pilih kategori yang paling relevan. Contoh: "Toko Oleh-oleh", "Toko Kerajinan Tangan", "Toko Makanan", atau "Toko Pakaian".',
        tip: 'Kamu bisa tambahkan lebih dari satu kategori nanti.',
      },
      {
        title: 'Masukkan lokasi toko',
        description: 'Masukkan alamat lengkap toko fisik kamu di Blitar. Pastikan pin di peta sudah tepat. Geser pin kalau belum akurat.',
        tip: 'Jika kamu tidak punya toko fisik, pilih "Saya mengirimkan barang dan jasa ke pelanggan" dan masukkan area layanan.',
      },
      {
        title: 'Tambahkan kontak & jam operasional',
        description: 'Masukkan nomor telepon dan jam buka toko. Ini akan muncul ketika orang menemukan toko kamu di Google Maps.',
      },
      {
        title: 'Verifikasi bisnis kamu',
        description: 'Google akan mengirim kode verifikasi via SMS, telepon, email, atau surat pos. Masukkan kode tersebut untuk menyelesaikan verifikasi.',
        tip: 'Verifikasi via telepon/SMS paling cepat (langsung). Via surat pos bisa 1-2 minggu.',
      },
      {
        title: 'Tambahkan foto & deskripsi',
        description: 'Upload foto toko, produk, dan interior. Tulis deskripsi singkat tentang toko kamu. Semakin lengkap, semakin mudah ditemukan!',
        tip: 'Tambahkan link website TokoBLITAR kamu: toko-blitar.vercel.app/store/SLUG-KAMU',
      },
      {
        title: '✅ Toko muncul di Google Maps!',
        description: 'Setelah diverifikasi, toko kamu akan muncul di pencarian Google Maps. Pembeli bisa menemukan toko kamu langsung dari HP mereka.',
      },
    ],
  },
  {
    id: 'tokopedia',
    name: 'Tokopedia',
    icon: '🟢',
    color: '#42b549',
    tagline: 'Jual produk kamu di Tokopedia — marketplace terbesar Indonesia',
    registerUrl: 'https://seller.tokopedia.com/new',
    steps: [
      {
        title: 'Buka Tokopedia Seller Center',
        description: 'Kunjungi halaman pendaftaran toko Tokopedia. Kamu bisa daftar dengan email, nomor HP, atau akun Google.',
        link: { label: 'Daftar Toko Tokopedia', url: 'https://seller.tokopedia.com/new' },
      },
      {
        title: 'Buat akun Tokopedia',
        description: 'Jika belum punya akun, daftar dulu. Masukkan email dan nomor HP aktif. Verifikasi via OTP yang dikirim ke HP kamu.',
      },
      {
        title: 'Isi informasi toko',
        description: 'Masukkan nama toko (gunakan nama yang sama dengan TokoBLITAR), domain toko, dan pilih lokasi toko di Blitar.',
        tip: 'Nama toko di Tokopedia tidak bisa diubah setelah dibuat. Pilih dengan cermat!',
      },
      {
        title: 'Pilih jenis toko',
        description: 'Untuk mulai, pilih "Official Store" jika punya brand sendiri, atau "Power Merchant" / "Regular Merchant" untuk toko biasa.',
      },
      {
        title: 'Tambahkan produk pertama',
        description: 'Upload produk pertama kamu. Masukkan nama, deskripsi, harga, stok, dan foto. Gunakan data yang sama dengan di TokoBLITAR.',
        tip: 'Kamu bisa copy-paste detail produk dari dashboard TokoBLITAR ke Tokopedia.',
      },
      {
        title: 'Atur pengiriman',
        description: 'Aktifkan jasa pengiriman yang tersedia di Blitar (JNE, J&T, SiCepat, dll). Masukkan alamat pickup yang benar.',
      },
      {
        title: 'Atur rekening bank',
        description: 'Tambahkan rekening bank untuk menerima pembayaran dari Tokopedia. Nama pemilik rekening harus sesuai dengan KTP.',
      },
      {
        title: '✅ Toko aktif di Tokopedia!',
        description: 'Toko kamu sekarang live di Tokopedia! Pembeli seluruh Indonesia bisa menemukan dan membeli produk kamu.',
      },
    ],
  },
  {
    id: 'shopee',
    name: 'Shopee',
    icon: '🟠',
    color: '#ee4d2d',
    tagline: 'Jangkau jutaan pembeli di Shopee Indonesia',
    registerUrl: 'https://seller.shopee.co.id/',
    steps: [
      {
        title: 'Buka Shopee Seller Centre',
        description: 'Kunjungi Shopee Seller Centre dan daftar sebagai penjual baru.',
        link: { label: 'Daftar Shopee Seller', url: 'https://seller.shopee.co.id/' },
      },
      {
        title: 'Daftar atau login',
        description: 'Gunakan nomor HP aktif untuk daftar. Shopee akan mengirim OTP. Kamu juga bisa login dengan akun Shopee yang sudah ada.',
      },
      {
        title: 'Lengkapi profil toko',
        description: 'Masukkan nama toko, deskripsi, dan upload logo. Gunakan informasi yang konsisten dengan TokoBLITAR.',
        tip: 'Upload logo yang sama agar pembeli mudah mengenali brand kamu.',
      },
      {
        title: 'Atur alamat & pengiriman',
        description: 'Masukkan alamat toko di Blitar sebagai alamat pengirim. Aktifkan jasa kurir yang tersedia di area kamu.',
      },
      {
        title: 'Tambahkan produk',
        description: 'Klik "Tambah Produk Baru". Upload foto, isi nama, deskripsi, harga, dan stok. Pilih kategori yang sesuai.',
        tip: 'Shopee mendukung hingga 9 foto per produk. Upload foto yang berkualitas!',
      },
      {
        title: 'Atur rekening bank',
        description: 'Hubungkan rekening bank untuk mencairkan saldo penjualan. Verifikasi dengan KTP dan foto selfie.',
      },
      {
        title: '✅ Toko aktif di Shopee!',
        description: 'Produk kamu sekarang bisa ditemukan oleh jutaan pengguna Shopee! Cek Shopee Seller Centre untuk kelola pesanan.',
      },
    ],
  },
  {
    id: 'lazada',
    name: 'Lazada',
    icon: '🔵',
    color: '#0f136d',
    tagline: 'Ekspansi penjualan ke Lazada Asia Tenggara',
    registerUrl: 'https://sellercenter.lazada.co.id/apps/register/landing',
    steps: [
      {
        title: 'Buka Lazada Seller Center',
        description: 'Kunjungi halaman registrasi Lazada Seller Center.',
        link: { label: 'Daftar Lazada Seller', url: 'https://sellercenter.lazada.co.id/apps/register/landing' },
      },
      {
        title: 'Pilih tipe penjual',
        description: 'Pilih "Lazada Marketplace" untuk individu/UMKM, atau "LazMall" jika kamu punya brand resmi.',
      },
      {
        title: 'Isi data pendaftaran',
        description: 'Masukkan nama, email, nomor HP, dan buat password. Verifikasi melalui OTP.',
      },
      {
        title: 'Upload dokumen',
        description: 'Upload KTP dan foto selfie memegang KTP. Pastikan foto jelas dan tidak buram.',
        tip: 'Proses verifikasi dokumen biasanya 1-3 hari kerja.',
      },
      {
        title: 'Lengkapi informasi toko',
        description: 'Masukkan nama toko, alamat gudang di Blitar, dan atur metode pengiriman yang tersedia.',
      },
      {
        title: 'Tambahkan produk',
        description: 'Setelah diverifikasi, masuk ke Seller Center dan mulai tambahkan produk. Isi detail lengkap termasuk foto dan deskripsi.',
      },
      {
        title: 'Atur rekening pembayaran',
        description: 'Tambahkan informasi rekening bank untuk menerima pembayaran.',
      },
      {
        title: '✅ Toko aktif di Lazada!',
        description: 'Toko kamu live di Lazada! Pantau penjualan melalui Lazada Seller Center.',
      },
    ],
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    color: '#E4405F',
    tagline: 'Promosikan produk lewat Instagram Business',
    registerUrl: 'https://www.instagram.com/accounts/emailsignup/',
    steps: [
      {
        title: 'Buat akun Instagram',
        description: 'Jika belum punya, buat akun Instagram baru. Gunakan nama toko kamu sebagai username.',
        link: { label: 'Daftar Instagram', url: 'https://www.instagram.com/accounts/emailsignup/' },
      },
      {
        title: 'Beralih ke akun Bisnis',
        description: 'Buka Settings → Account → Switch to Professional Account → pilih "Business". Ini gratis dan memberi akses ke insight & analytics.',
        tip: 'Akun bisnis diperlukan untuk menggunakan fitur Shopping dan insight.',
      },
      {
        title: 'Hubungkan ke Facebook Page',
        description: 'Instagram Business membutuhkan Facebook Page. Buat Facebook Page untuk toko kamu jika belum ada, lalu hubungkan dari Settings Instagram.',
      },
      {
        title: 'Lengkapi profil bisnis',
        description: 'Tambahkan foto profil (logo toko), bio yang menarik, alamat toko, dan link ke halaman toko TokoBLITAR kamu.',
        tip: 'Di bio, tulis: "🛒 Belanja di toko-blitar.vercel.app/store/SLUG-KAMU"',
      },
      {
        title: 'Mulai posting produk',
        description: 'Upload foto produk terbaik kamu. Gunakan hashtag lokal seperti #UMKMBlitar #OlehOlehBlitar #TokoBLITAR.',
        tip: 'Foto dengan pencahayaan natural dan background bersih paling menarik perhatian.',
      },
      {
        title: '(Opsional) Aktifkan Instagram Shopping',
        description: 'Untuk tag produk langsung di foto, ajukan Instagram Shopping di Settings → Business → Shopping. Butuh Facebook Commerce Manager.',
      },
      {
        title: '✅ Toko aktif di Instagram!',
        description: 'Mulai promosikan produk kamu! Post secara konsisten (minimal 3x seminggu) dan gunakan Stories & Reels untuk jangkauan lebih luas.',
      },
    ],
  },
]

function StepTracker({ steps }: { steps: PlatformGuide['steps'] }) {
  const [completed, setCompleted] = useState<Set<number>>(new Set())

  function toggleStep(index: number) {
    setCompleted((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={i} className="relative flex gap-4 pb-6 last:pb-0">
          {/* Vertical Line */}
          {i < steps.length - 1 && (
            <div className="absolute left-[15px] top-[32px] h-[calc(100%-16px)] w-[2px] bg-gray-100" />
          )}

          {/* Step Circle */}
          <button
            onClick={() => toggleStep(i)}
            className="relative z-10 mt-0.5 shrink-0"
          >
            {completed.has(i) ? (
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-200 bg-white text-xs font-bold text-gray-400">
                {i + 1}
              </div>
            )}
          </button>

          {/* Step Content */}
          <div className="flex-1 pt-0.5">
            <h4 className={`text-sm font-semibold ${completed.has(i) ? 'text-green-700 line-through' : 'text-gray-800'}`}>
              {step.title}
            </h4>
            <p className="mt-1 text-sm leading-relaxed text-gray-500">{step.description}</p>
            {step.tip && (
              <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                💡 <strong>Tip:</strong> {step.tip}
              </div>
            )}
            {step.link && (
              <a
                href={step.link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-1.5 text-xs font-medium text-white transition-transform hover:scale-105"
              >
                {step.link.label}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      ))}

      {/* Progress */}
      <div className="mt-4 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-300"
            style={{ width: `${(completed.size / steps.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium text-gray-500">
          {completed.size}/{steps.length}
        </span>
      </div>
    </div>
  )
}

export default function MarketplacePage() {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Hubungkan Toko</h1>
        <p className="text-sm text-gray-500">
          Daftarkan toko kamu di Google Maps & marketplace agar bisa ditemukan lebih banyak pembeli
        </p>
      </div>

      <div className="space-y-4">
        {PLATFORMS.map((platform) => {
          const isExpanded = expanded === platform.id
          return (
            <Card key={platform.id} className="overflow-hidden transition-shadow hover:shadow-md">
              <button
                onClick={() => setExpanded(isExpanded ? null : platform.id)}
                className="flex w-full items-center justify-between px-6 py-5 text-left"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                    style={{ backgroundColor: `${platform.color}15` }}
                  >
                    {platform.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800">{platform.name}</h3>
                      <Badge variant="secondary" className="text-[10px]">
                        {platform.steps.length} langkah
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">{platform.tagline}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={platform.registerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="hidden items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 sm:inline-flex"
                  >
                    Buka <ExternalLink className="h-3 w-3" />
                  </a>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <CardContent className="border-t bg-white px-6 pb-6 pt-6">
                  <StepTracker steps={platform.steps} />
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
