import { createSupabaseServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProductCard } from '@/components/buyer/ProductCard'
import { MapPin, Store } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createSupabaseServerClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: store } = await (supabase as any)
    .from('stores').select('name, description').eq('slug', slug).single()

  if (!store) return { title: 'Toko Tidak Ditemukan' }
  return {
    title: `${store.name} — TokoBLITAR`,
    description: store.description || `Toko ${store.name} di TokoBLITAR`,
    openGraph: { title: store.name, description: store.description },
  }
}

export default async function PublicStorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createSupabaseServerClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: store } = await (supabase as any)
    .from('stores')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!store) return notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: products } = await (supabase as any)
    .from('products')
    .select('*, product_images(*)')
    .eq('store_id', store.id)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-gray-50">
      <div
        className="px-6 py-12 text-white"
        style={{ background: 'linear-gradient(135deg, var(--color-tb-primary) 0%, var(--color-tb-secondary) 100%)' }}
      >
        <div className="mx-auto flex max-w-5xl items-center gap-5">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-3xl font-bold text-white"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
          >
            {store.logo_url ? (
              <img src={store.logo_url} alt="" className="h-20 w-20 rounded-2xl object-cover" />
            ) : (
              store.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{store.name}</h1>
            {store.description && <p className="mt-1 text-sm text-white/80">{store.description}</p>}
            {store.address && (
              <p className="mt-1 flex items-center gap-1 text-xs text-white/70">
                <MapPin className="h-3 w-3" /> {store.address}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <h2 className="mb-4 text-lg font-bold">Produk ({products?.length || 0})</h2>
        {products && products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p: { id: string; name: string; price: number; product_images: { url: string; is_primary: boolean }[] }) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-gray-500">
            <Store className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p>Toko belum memiliki produk</p>
          </div>
        )}
      </div>
    </main>
  )
}
