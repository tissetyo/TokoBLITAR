import { createSupabaseServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProductDetail } from '@/components/buyer/ProductDetail'

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: product } = await (supabase as any)
    .from('products')
    .select('*, product_images(*), stores(id, name, slug, logo_url, description, address)')
    .eq('id', id)
    .eq('status', 'active')
    .is('deleted_at', null)
    .single()

  if (!product) return notFound()

  return <ProductDetail product={product} />
}
