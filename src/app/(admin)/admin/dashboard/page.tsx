import { createSupabaseServerClient } from '@/lib/supabase/server'
import { AdminDashboardContent } from '@/components/admin/AdminDashboardContent'

export default async function AdminDashboard() {
  const supabase = await createSupabaseServerClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [storesRes, productsRes, ordersRes, usersRes, recentOrdersRes, recentStoresRes, monthlyOrdersRes] = await Promise.all([
    (supabase as any).from('stores').select('id', { count: 'exact', head: true }),
    (supabase as any).from('products').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    (supabase as any).from('orders').select('total_amount', { count: 'exact' }),
    (supabase as any).from('users').select('id', { count: 'exact', head: true }),
    (supabase as any)
      .from('orders')
      .select('id, total_amount, status, created_at, stores(name), users(full_name)')
      .order('created_at', { ascending: false })
      .limit(5),
    (supabase as any)
      .from('stores')
      .select('id, name, created_at, users(full_name)')
      .order('created_at', { ascending: false })
      .limit(5),
    (supabase as any)
      .from('orders')
      .select('total_amount, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
  ])

  const revenue = (ordersRes.data as { total_amount: number }[] | null)
    ?.reduce((s: number, o: { total_amount: number }) => s + Number(o.total_amount), 0) || 0

  const stats = {
    totalUsers: usersRes.count || 0,
    totalStores: storesRes.count || 0,
    totalProducts: productsRes.count || 0,
    totalOrders: ordersRes.count || 0,
    totalRevenue: revenue,
  }

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

  const recentOrders = (recentOrdersRes.data as any[])?.map((o: any) => ({
    id: o.id,
    amount: Number(o.total_amount),
    status: o.status,
    date: o.created_at,
    storeName: o.stores?.name || 'Toko Tidak Dikenal',
    buyerName: o.users?.full_name || 'Pembeli'
  })) || []

  const recentStores = (recentStoresRes.data as any[])?.map((s: any) => ({
    id: s.id,
    name: s.name,
    ownerName: s.users?.full_name || 'Owner',
    date: s.created_at
  })) || []

  return (
    <AdminDashboardContent
      stats={stats}
      salesData={salesData}
      recentOrders={recentOrders}
      recentStores={recentStores}
    />
  )
}
