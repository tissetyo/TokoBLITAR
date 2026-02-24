import { createSupabaseServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProductCard } from '@/components/buyer/ProductCard'
import { MapPin, Store } from 'lucide-react'
import { getTheme, getFont } from '@/lib/themes'

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

  if (!store.web_enabled) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <Store className="h-16 w-16 text-slate-300 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800">Toko Sedang Offline</h1>
        <p className="mt-2 text-slate-500 max-w-sm">Toko {store.name} tidak mengaktifkan tampilan Web Toko. Silakan kunjungi halaman sosial mereka.</p>
        {store.bio_enabled && (
          <a href={`/bio/${slug}`} className="mt-6 rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition">Lihat Link-in-Bio</a>
        )}
      </main>
    )
  }

  // Load Aesthetic Preset
  const theme = getTheme(store.theme)
  const font = getFont(store.font_family)

  return (
    <main className={`min-h-screen ${theme.background} ${font.fontClass}`}>
      <div className={`px-6 py-12 shadow-sm relative overflow-hidden`} style={{ backgroundColor: theme.primaryColor }}>
        {/* Cover ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        <div className="relative mx-auto flex max-w-5xl items-center gap-5 z-10 text-white">
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
          <div className="flex-1">
            <h1 className="text-2xl font-bold sm:text-3xl">{store.name}</h1>
            {store.description && <p className="mt-1 text-sm text-white/90">{store.description}</p>}
            {store.address && (
              <p className="mt-1 flex items-center gap-1 text-xs text-white/70">
                <MapPin className="h-3 w-3" /> {store.address}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 relative z-10">
        <h2 className={`mb-4 text-lg font-bold ${theme.textColor}`}>Produk ({products?.length || 0})</h2>
        {products && products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p: { id: string; name: string; price: number; product_images: { url: string; is_primary: boolean }[] }) => (
              <div key={p.id} className={`rounded-xl overflow-hidden ${theme.cardBg}`}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        ) : (
          <div className={`py-16 text-center ${theme.secondaryTextColor}`}>
            <Store className={`mx-auto mb-3 h-10 w-10 opacity-50`} />
            <p>Toko belum memiliki produk</p>
          </div>
        )}
      </div>
    </main>
  )
}
