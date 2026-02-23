import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatPrice, formatDate } from '@/lib/utils'
import { User, Package, Crown } from 'lucide-react'
import { ProfileForm } from '@/components/buyer/ProfileForm'

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orders } = await (supabase as any)
    .from('orders')
    .select('id, status, total_amount, created_at, stores(name)')
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: membership } = await (supabase as any)
    .from('memberships')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* User Info */}
        {/* Profile Form (Editable) */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profil & Alamat Pengiriman</CardTitle>
            <CardDescription>Perbarui data diri dan alamat utama Anda untuk mempermudah checkout.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm profile={profile} email={user.email || ''} />
          </CardContent>
        </Card>

        {/* Membership */}
        {membership && (
          <Card className="mb-6 border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50">
            <CardContent className="flex items-center gap-4 py-5">
              <Crown className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="font-bold text-yellow-800">
                  Member {membership.tier.charAt(0).toUpperCase() + membership.tier.slice(1)}
                </p>
                <p className="text-sm text-yellow-700">{membership.points} poin</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4" /> Riwayat Pesanan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!orders || orders.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <p>Belum ada pesanan</p>
                <Button asChild className="mt-3" variant="outline">
                  <Link href="/products">Mulai Belanja</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order: { id: string; status: string; total_amount: number; created_at: string; stores: { name: string } }) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50"
                  >
                    <div>
                      <p className="text-sm font-medium">#{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-gray-500">{order.stores?.name} • {formatDate(order.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatPrice(order.total_amount)}</p>
                      <Badge variant="secondary" className={statusColor[order.status] || ''}>
                        {order.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
