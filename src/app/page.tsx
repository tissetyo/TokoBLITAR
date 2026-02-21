import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/buyer/ProductCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, MapPin, Store, ShoppingBag, Sparkles, TrendingUp } from 'lucide-react'

export const revalidate = 60 // ISR 60s

export default async function HomePage() {
  const supabase = await createSupabaseServerClient()

  // Fetch featured products
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: featuredProducts } = await (supabase as any)
    .from('products')
    .select('*, product_images(*), stores(name, slug)')
    .eq('status', 'active')
    .eq('is_featured', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(8)

  // Fetch latest products
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: latestProducts } = await (supabase as any)
    .from('products')
    .select('*, product_images(*), stores(name, slug)')
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(12)

  // Fetch categories
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: categories } = await (supabase as any)
    .from('categories')
    .select('id, name, slug')
    .order('name')

  // Fetch featured stores
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

  return (
    <main className="min-h-screen" style={{ backgroundColor: 'var(--color-tb-bg)' }}>
      {/* Hero Section */}
      <section
        className="relative overflow-hidden px-6 py-24 sm:py-32"
        style={{
          background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 50%, #F43F5E 100%)',
        }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-medium text-white backdrop-blur-md">
            <MapPin className="h-4 w-4" />
            Marketplace UMKM Kabupaten Blitar
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-7xl">
            Toko
            <span style={{ color: '#FDE68A' }}>BLITAR</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/80 sm:text-xl">
            Temukan produk UMKM terbaik dari Kabupaten Blitar.
            <br className="hidden sm:block" />
            Dukung usaha lokal, belanja langsung dari pengrajin.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="h-12 px-8 text-base font-semibold shadow-lg" style={{ backgroundColor: 'white', color: '#2563EB' }}>
              <Link href="/products">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Jelajahi Produk
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 border-2 border-white/40 px-8 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/20">
              <Link href="/register">
                <Store className="mr-2 h-5 w-5" />
                Daftar Penjual
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-12 flex max-w-lg justify-center gap-8 rounded-2xl border border-white/10 bg-white/10 px-8 py-4 backdrop-blur-md sm:gap-16">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">100+</p>
              <p className="text-xs text-white/60">Produk</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">50+</p>
              <p className="text-xs text-white/60">UMKM</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">6</p>
              <p className="text-xs text-white/60">Kategori</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {/* Category Chips */}
        {categories && categories.length > 0 && (
          <section className="mb-12">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5" style={{ color: 'var(--color-tb-primary)' }} />
              <h2 className="text-lg font-bold">Kategori</h2>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {categories.map((cat: { id: string; name: string; slug: string }) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="flex flex-col items-center gap-2 rounded-xl border bg-white px-4 py-4 text-center transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <span className="text-2xl">{CATEGORY_ICONS[cat.slug] || '📦'}</span>
                  <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured Stores */}
        {stores && stores.length > 0 && (
          <section className="mb-12">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5" style={{ color: 'var(--color-tb-primary)' }} />
                <h2 className="text-lg font-bold">Toko Pilihan</h2>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stores.map((store: { id: string; name: string; slug: string; logo_url: string | null; description: string | null }) => (
                <Link
                  key={store.id}
                  href={`/store/${store.slug}`}
                  className="group flex items-center gap-4 rounded-xl border bg-white p-5 transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-xl font-bold text-white shadow-sm"
                    style={{ background: 'linear-gradient(135deg, var(--color-tb-primary) 0%, var(--color-tb-secondary) 100%)' }}
                  >
                    {store.logo_url ? (
                      <img src={store.logo_url} alt="" className="h-14 w-14 rounded-xl object-cover" />
                    ) : (
                      store.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate group-hover:text-blue-600 transition-colors">{store.name}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">{store.description || 'UMKM Blitar'}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured Products */}
        {featuredProducts && featuredProducts.length > 0 && (
          <section className="mb-12">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" style={{ color: 'var(--color-tb-accent)' }} />
                <h2 className="text-lg font-bold">Produk Unggulan</h2>
              </div>
              <Link href="/products?featured=true" className="flex items-center gap-1 text-sm font-medium transition-colors hover:underline" style={{ color: 'var(--color-tb-primary)' }}>
                Lihat semua <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {featuredProducts.map((p: { id: string; name: string; price: number; stores: { name: string; slug: string }; product_images: { url: string; is_primary: boolean }[] }) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Latest Products */}
        <section className="mb-12">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" style={{ color: 'var(--color-tb-primary)' }} />
              <h2 className="text-lg font-bold">Produk Terbaru</h2>
            </div>
            <Link href="/products" className="flex items-center gap-1 text-sm font-medium transition-colors hover:underline" style={{ color: 'var(--color-tb-primary)' }}>
              Lihat semua <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {latestProducts && latestProducts.length > 0 ? (
              latestProducts.map((p: { id: string; name: string; price: number; stores: { name: string; slug: string }; product_images: { url: string; is_primary: boolean }[] }) => (
                <ProductCard key={p.id} product={p} />
              ))
            ) : (
              <div className="col-span-full rounded-2xl border bg-white py-20 text-center text-gray-500">
                <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <p className="text-lg font-medium text-gray-700">Belum ada produk</p>
                <p className="mt-1 text-sm">Jadilah penjual pertama di TokoBLITAR!</p>
                <Button asChild className="mt-6" size="lg" style={{ backgroundColor: 'var(--color-tb-primary)' }}>
                  <Link href="/register">
                    <Store className="mr-2 h-4 w-4" />
                    Daftar Penjual
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white px-6 py-8">
        <div className="mx-auto max-w-7xl text-center text-sm text-gray-500">
          <p className="font-medium text-gray-700">TokoBLITAR</p>
          <p className="mt-1">Marketplace UMKM Kabupaten Blitar © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </main>
  )
}
