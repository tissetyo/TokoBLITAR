import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Store, Package, ShoppingCart, DollarSign, Users } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

export default async function AdminDashboard() {
  const supabase = await createSupabaseServerClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [storesRes, productsRes, ordersRes, usersRes] = await Promise.all([
    (supabase as any).from('stores').select('id', { count: 'exact', head: true }),
    (supabase as any).from('products').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    (supabase as any).from('orders').select('id, total_amount', { count: 'exact' }),
    (supabase as any).from('users').select('id', { count: 'exact', head: true }),
  ])

  const revenue = (ordersRes.data as { total_amount: number }[] | null)
    ?.reduce((s: number, o: { total_amount: number }) => s + Number(o.total_amount), 0) || 0

  const stats = [
    { label: 'Total Pengguna', value: usersRes.count || 0, icon: Users, color: 'bg-blue-100 text-blue-700' },
    { label: 'Total Toko', value: storesRes.count || 0, icon: Store, color: 'bg-green-100 text-green-700' },
    { label: 'Total Produk', value: productsRes.count || 0, icon: Package, color: 'bg-purple-100 text-purple-700' },
    { label: 'Total Pesanan', value: ordersRes.count || 0, icon: ShoppingCart, color: 'bg-orange-100 text-orange-700' },
    { label: 'Total Pendapatan', value: formatPrice(revenue), icon: DollarSign, color: 'bg-yellow-100 text-yellow-700' },
  ]

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 py-5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
