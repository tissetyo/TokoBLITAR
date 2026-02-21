import { createSupabaseServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { OrderTracker } from '@/components/buyer/OrderTracker'

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order } = await (supabase as any)
    .from('orders')
    .select('*, order_items(*, products(name, product_images(url, is_primary))), stores(name), shipments(*)')
    .eq('id', id)
    .eq('buyer_id', user.id)
    .single()

  if (!order) return notFound()

  return <OrderTracker order={order} />
}
