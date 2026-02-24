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
    .select('id, name')
    .eq('user_id', user.id)
    .maybeSingle()

  // If no store, show onboarding
  if (!store) {
    return <OnboardingStepper />
  }

  const storeData = store as { id: string, name: string }
  const storeId = storeData.id

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Fetch basic stats and dashboard data
  const [productsRes, ordersRes, recentOrdersRes, recentProductsRes, monthlyOrdersRes] = await Promise.all([
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .is('deleted_at', null),
    supabase
      .from('orders')
      .select('total_amount', { count: 'exact' })
      .eq('store_id', storeId),
    supabase
      .from('orders')
      .select('id, total_amount, status, created_at, users(full_name)')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('products')
      .select('id, name, price, stock, status, product_images(url)')
      .eq('store_id', storeId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('orders')
      .select('total_amount, created_at')
      .eq('store_id', storeId)
      .gte('created_at', thirtyDaysAgo.toISOString())
  ])

  const totalProducts = productsRes.count || 0
  const totalOrders = ordersRes.count || 0
  const totalRevenue = (ordersRes.data as Array<{ total_amount: number }> | null)
    ?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0

  // Calculate generic active orders/customers
  // Simplified approximation for view: total unique buyers or static mock
  const totalCustomers = Array.from(new Set(recentOrdersRes.data?.map((o: any) => o.users?.full_name))).length || 0

  // Format Sales Data for Chart
  const salesMap = new Map<string, number>()
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    salesMap.set(d.toISOString().split('T')[0], 0)
  }

  ; (monthlyOrdersRes.data as any[])?.forEach((order: any) => {
    const date = new Date(order.created_at).toISOString().split('T')[0]
    if (salesMap.has(date)) {
      salesMap.set(date, salesMap.get(date)! + Number(order.total_amount))
    }
  })

  const salesData = Array.from(salesMap.entries()).map(([date, amount]) => ({
    date: new Date(date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
    amount
  }))

  const recentOrders = (recentOrdersRes.data as any[])?.map(o => ({
    id: o.id,
    amount: Number(o.total_amount),
    status: o.status,
    date: o.created_at,
    buyerName: o.users?.full_name || 'Pembeli'
  })) || []

  const recentProducts = (recentProductsRes.data as any[])?.map(p => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    stock: p.stock,
    status: p.status,
    image: p.product_images?.[0]?.url || null
  })) || []

  return (
    <DashboardContent
      storeName={storeData.name}
      sellerName={user.user_metadata?.full_name || 'Seller'}
      stats={{
        totalProducts,
        totalOrders,
        totalRevenue,
        totalCustomers,
      }}
      salesData={salesData}
      recentOrders={recentOrders}
      recentProducts={recentProducts}
    />
  )
}
