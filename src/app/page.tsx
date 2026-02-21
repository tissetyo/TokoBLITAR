import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowRight,
  Search,
  ChevronRight,
  ChevronLeft,
  Store,
  ShoppingBag,
  HelpCircle,
} from 'lucide-react'

export const revalidate = 60

export default async function HomePage() {
  const supabase = await createSupabaseServerClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: latestProducts } = await (supabase as any)
    .from('products')
    .select('*, product_images(*), stores(name, slug)')
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(8)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: featuredProducts } = await (supabase as any)
    .from('products')
    .select('*, product_images(*), stores(name, slug)')
    .eq('status', 'active')
    .eq('is_featured', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(4)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: categories } = await (supabase as any)
    .from('categories')
    .select('id, name, slug')
    .order('name')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: stores } = await (supabase as any)
    .from('stores')
    .select('id, name, slug, logo_url, description')
    .eq('status', 'active')
    .limit(6)

  const CATEGORY_ICONS: Record<string, string> = {
    makanan: '🍜',
    minuman: '🥤',
    kerajinan: '🎨',
    fashion: '👗',
    pertanian: '🌾',
    lainnya: '📦',
  }

  const GRADIENT_COLORS = [
    'linear-gradient(135deg, #fda4af 0%, #fb923c 50%, #fbbf24 100%)',
    'linear-gradient(135deg, #93c5fd 0%, #818cf8 50%, #c084fc 100%)',
    'linear-gradient(135deg, #86efac 0%, #34d399 50%, #2dd4bf 100%)',
    'linear-gradient(135deg, #fca5a5 0%, #f87171 50%, #fb923c 100%)',
  ]

  return (
    <main className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black">
              <span className="text-sm font-bold text-white">T</span>
            </div>
            <span className="text-sm font-semibold">TokoBLITAR</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/products" className="text-sm text-gray-600 hover:text-black transition-colors">
              Produk
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm" className="rounded-full">
                Masuk
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pt-6">
        <div
          className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl px-8 py-16 sm:py-24"
          style={{
            background: 'linear-gradient(135deg, #fecdd3 0%, #fdba74 30%, #fb923c 60%, #e07965 100%)',
          }}
        >
          {/* Abstract decorative shapes */}
          <div className="absolute right-0 top-0 h-full w-1/2 opacity-40">
            <div className="absolute right-10 top-10 h-40 w-40 rounded-full" style={{ background: 'linear-gradient(135deg, #f97316, #ec4899)' }} />
            <div className="absolute right-40 bottom-10 h-56 w-56 rounded-full" style={{ background: 'linear-gradient(135deg, #f9a8d4, #fbbf24)', filter: 'blur(40px)' }} />
            <div className="absolute right-20 top-1/2 h-32 w-32 rounded-full" style={{ background: 'linear-gradient(135deg, #c084fc, #f472b6)', filter: 'blur(30px)' }} />
          </div>

          <div className="relative z-10 max-w-xl">
            <p className="mb-2 text-sm font-medium text-white/80">Marketplace UMKM Blitar</p>
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl" style={{ fontFamily: "'Georgia', serif" }}>
              Temukan yang
              <br />
              kamu suka
            </h1>
            <p className="mt-4 text-sm text-white/70">
              Jelajahi produk UMKM terbaik dari Kabupaten Blitar. Dukung usaha lokal.
            </p>

            {/* Search bar */}
            <div className="mt-8 flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Cari produk atau toko..."
                  className="h-12 rounded-full border-0 bg-white/90 pl-5 pr-12 text-sm shadow-lg backdrop-blur-sm placeholder:text-gray-400"
                />
              </div>
              <Link href="/products">
                <Button className="h-12 rounded-full bg-black px-6 text-sm font-medium text-white hover:bg-gray-800">
                  <Search className="mr-2 h-4 w-4" />
                  Cari
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      {categories && categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 pt-8">
          <div className="flex items-center justify-between border-b">
            <div className="flex gap-1">
              <Link
                href="/products"
                className="border-b-2 border-black px-4 py-3 text-sm font-medium text-black"
              >
                Semua
              </Link>
              {categories.map((cat: { id: string; name: string; slug: string }) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="border-b-2 border-transparent px-4 py-3 text-sm text-gray-500 transition-colors hover:text-black"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
            <Link href="/products" className="flex items-center gap-1 text-sm text-gray-500 hover:text-black">
              <HelpCircle className="h-4 w-4" />
              Lihat Semua
            </Link>
          </div>
        </section>
      )}

      {/* Featured Products — Large Cards with Image Overlay */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">✦ Produk pilihan</p>
            <h2 className="text-xl font-bold">Temukan produk terbaik</h2>
          </div>
          <div className="flex gap-2">
            <button className="flex h-8 w-8 items-center justify-center rounded-full border transition-colors hover:bg-gray-50">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-full border transition-colors hover:bg-gray-50">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {featuredProducts && featuredProducts.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.slice(0, 3).map((p: { id: string; name: string; price: number; description: string | null; stores: { name: string; slug: string }; product_images: { url: string; is_primary: boolean }[] }, i: number) => {
              const primaryImage = p.product_images?.find((img: { is_primary: boolean }) => img.is_primary) || p.product_images?.[0]
              return (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="group relative overflow-hidden rounded-2xl"
                  style={{ aspectRatio: '4/5' }}
                >
                  {primaryImage ? (
                    <img src={primaryImage.url} alt={p.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="absolute inset-0" style={{ background: GRADIENT_COLORS[i % GRADIENT_COLORS.length] }} />
                  )}
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="mb-1 text-xs font-medium text-white/70">
                      ✦ {p.stores?.name || 'UMKM Blitar'}
                    </p>
                    <h3 className="text-lg font-semibold text-white line-clamp-2">{p.name}</h3>
                    <div className="mt-3 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      Rp {p.price.toLocaleString('id-ID')}
                    </div>
                  </div>
                  {/* Category label */}
                  <div className="absolute left-4 top-4">
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      Produk Unggulan
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex items-end rounded-2xl p-6"
                style={{ aspectRatio: '4/5', background: GRADIENT_COLORS[i] }}
              >
                <div>
                  <p className="text-xs text-white/70">✦ Segera hadir</p>
                  <h3 className="text-lg font-semibold text-white">
                    {['Keripik Tempe Blitar', 'Batik Tulis Khas', 'Kopi Robusta Blitar'][i]}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Latest Products — Mixed Grid */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">✦ Produk terbaru</p>
            <h2 className="text-xl font-bold">Jangan sampai kehabisan</h2>
          </div>
          <div className="flex gap-2">
            <button className="flex h-8 w-8 items-center justify-center rounded-full border transition-colors hover:bg-gray-50">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-full border transition-colors hover:bg-gray-50">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          {/* Left: Category Quick Links */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-2 gap-3">
              {(categories || []).slice(0, 4).map((cat: { id: string; name: string; slug: string }) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="flex flex-col items-center gap-2 rounded-2xl bg-gray-50 px-4 py-6 text-center transition-all hover:bg-gray-100 hover:-translate-y-0.5"
                >
                  <span className="text-2xl">{CATEGORY_ICONS[cat.slug] || '📦'}</span>
                  <span className="text-xs font-semibold text-gray-800">{cat.name}</span>
                  <span className="text-[10px] text-gray-400 leading-tight">Produk UMKM Blitar</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Right: Product Cards */}
          <div className="lg:col-span-9">
            {latestProducts && latestProducts.length > 0 ? (
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                {latestProducts.slice(0, 6).map((p: { id: string; name: string; price: number; stores: { name: string; slug: string }; product_images: { url: string; is_primary: boolean }[] }, i: number) => {
                  const primaryImage = p.product_images?.find((img: { is_primary: boolean }) => img.is_primary) || p.product_images?.[0]
                  return (
                    <Link
                      key={p.id}
                      href={`/products/${p.id}`}
                      className="group overflow-hidden rounded-2xl bg-gray-50 transition-all hover:shadow-md hover:-translate-y-0.5"
                    >
                      <div className="relative aspect-square overflow-hidden">
                        {primaryImage ? (
                          <img src={primaryImage.url} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center" style={{ background: GRADIENT_COLORS[i % GRADIENT_COLORS.length] }}>
                            <ShoppingBag className="h-8 w-8 text-white/60" />
                          </div>
                        )}
                        {/* Category badge */}
                        <div className="absolute left-2 top-2">
                          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium text-gray-700 shadow-sm backdrop-blur-sm">
                            {p.stores?.name || 'UMKM'}
                          </span>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-gray-500">✦ {p.stores?.name}</p>
                        <h3 className="mt-0.5 text-sm font-medium text-gray-800 line-clamp-1">{p.name}</h3>
                        <div className="mt-2 inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-800 shadow-sm">
                          Rp {p.price.toLocaleString('id-ID')}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-gray-50 py-20 text-center">
                <ShoppingBag className="mb-4 h-12 w-12 text-gray-300" />
                <p className="text-lg font-medium text-gray-700">Belum ada produk</p>
                <p className="mt-1 text-sm text-gray-500">Jadilah penjual pertama di TokoBLITAR!</p>
                <Button asChild className="mt-6 rounded-full" size="lg">
                  <Link href="/register">
                    <Store className="mr-2 h-4 w-4" />
                    Daftar Penjual
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Stores */}
      {stores && stores.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500">✦ Toko pilihan</p>
            <h2 className="text-xl font-bold">UMKM terpercaya</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((store: { id: string; name: string; slug: string; logo_url: string | null; description: string | null }) => (
              <Link
                key={store.id}
                href={`/store/${store.slug}`}
                className="group flex items-center gap-4 rounded-2xl border bg-white p-5 transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-lg font-bold text-gray-600 group-hover:bg-black group-hover:text-white transition-all">
                  {store.logo_url ? (
                    <img src={store.logo_url} alt="" className="h-12 w-12 rounded-xl object-cover" />
                  ) : (
                    store.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate group-hover:text-black">{store.name}</p>
                  <p className="text-xs text-gray-400 line-clamp-1">{store.description || 'UMKM Kabupaten Blitar'}</p>
                </div>
                <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-gray-300 group-hover:text-black transition-colors" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t bg-white px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black">
                <span className="text-sm font-bold text-white">T</span>
              </div>
              <span className="font-semibold">TokoBLITAR</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link href="/products" className="hover:text-black transition-colors">Produk</Link>
              <Link href="/register" className="hover:text-black transition-colors">Daftar Penjual</Link>
              <Link href="/login" className="hover:text-black transition-colors">Masuk</Link>
            </div>
            <p className="text-xs text-gray-400">© {new Date().getFullYear()} Marketplace UMKM Blitar</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
