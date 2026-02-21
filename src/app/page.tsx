import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/buyer/ProductCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, MapPin, Store, ShoppingBag } from 'lucide-react'

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

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section
        className="relative overflow-hidden px-6 py-20 text-white"
        style={{ background: 'linear-gradient(135deg, var(--color-tb-primary) 0%, var(--color-tb-secondary) 100%)' }}
      >
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm backdrop-blur-sm">
            <MapPin className="h-4 w-4" />
            Marketplace UMKM Kabupaten Blitar
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            TokoBLITAR
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">
            Temukan produk UMKM terbaik dari Kabupaten Blitar. Dukung usaha lokal, belanja langsung dari pengrajin.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link href="/products">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Jelajahi Produk
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">
              <Link href="/register">
                <Store className="mr-2 h-4 w-4" />
                Daftar Jadi Penjual
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Category Chips */}
        {categories && categories.length > 0 && (
          <section className="mb-10">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat: { id: string; name: string; slug: string }) => (
                <Link key={cat.id} href={`/products?category=${cat.slug}`}>
                  <Badge variant="outline" className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100 transition-colors">
                    {cat.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured Stores */}
        {stores && stores.length > 0 && (
          <section className="mb-12">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Toko Pilihan</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stores.map((store: { id: string; name: string; slug: string; logo_url: string | null; description: string | null }) => (
                <Link
                  key={store.id}
                  href={`/store/${store.slug}`}
                  className="flex items-center gap-4 rounded-xl border bg-white p-4 transition-shadow hover:shadow-md"
                >
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-lg font-bold text-white"
                    style={{ backgroundColor: 'var(--color-tb-primary)' }}
                  >
                    {store.logo_url ? (
                      <img src={store.logo_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    ) : (
                      store.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{store.name}</p>
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
              <h2 className="text-xl font-bold">Produk Unggulan ⭐</h2>
              <Link href="/products?featured=true" className="flex items-center text-sm font-medium" style={{ color: 'var(--color-tb-primary)' }}>
                Lihat semua <ArrowRight className="ml-1 h-4 w-4" />
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
            <h2 className="text-xl font-bold">Produk Terbaru</h2>
            <Link href="/products" className="flex items-center text-sm font-medium" style={{ color: 'var(--color-tb-primary)' }}>
              Lihat semua <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {latestProducts && latestProducts.length > 0 ? (
              latestProducts.map((p: { id: string; name: string; price: number; stores: { name: string; slug: string }; product_images: { url: string; is_primary: boolean }[] }) => (
                <ProductCard key={p.id} product={p} />
              ))
            ) : (
              <div className="col-span-full py-16 text-center text-gray-500">
                <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                <p>Belum ada produk. Jadilah penjual pertama!</p>
                <Button asChild className="mt-4" variant="outline">
                  <Link href="/register">Daftar Penjual</Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
