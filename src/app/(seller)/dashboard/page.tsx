import { createSupabaseServerClient } from '@/lib/supabase/server'
import { OnboardingStepper } from '@/components/seller/OnboardingStepper'
import { DashboardContent } from '@/components/seller/DashboardContent'

export default async function SellerDashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Check if seller has a store
  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  // If no store, show onboarding
  if (!store) {
    return <OnboardingStepper />
  }

  const storeId = (store as { id: string }).id

  // Fetch basic stats
  const [productsRes, ordersRes] = await Promise.all([
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId),
    supabase
      .from('orders')
      .select('id, total_amount', { count: 'exact' })
      .eq('store_id', storeId),
  ])

  const totalProducts = productsRes.count || 0
  const totalOrders = ordersRes.count || 0
  const totalRevenue = (ordersRes.data as Array<{ total_amount: number }> | null)
    ?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0

  return (
    <DashboardContent
      stats={{
        totalProducts,
        totalOrders,
        totalRevenue,
        totalCustomers: 0,
      }}
    />
  )
}
