'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cartStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'
import { CreditCard, MapPin, Truck } from 'lucide-react'

export default function CheckoutPage() {
  const router = useRouter()
  const items = useCartStore((s) => s.items)
  const total = useCartStore((s) => s.total)
  const clearCart = useCartStore((s) => s.clear)
  const [loading, setLoading] = useState(false)
  const [address, setAddress] = useState({
    name: '',
    phone: '',
    street: '',
    city: 'Blitar',
    province: 'Jawa Timur',
    postal_code: '',
  })

  if (items.length === 0) {
    router.push('/cart')
    return null
  }

  async function handleCheckout() {
    if (!address.name || !address.phone || !address.street) {
      toast.error('Lengkapi alamat pengiriman')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/buyer/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
          })),
          shipping_address: address,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Gagal membuat pesanan')
        setLoading(false)
        return
      }

      clearCart()
      toast.success('Pesanan dibuat!')
      router.push(`/orders/${data.order.id}`)
    } catch {
      toast.error('Terjadi kesalahan')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-bold">Checkout</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4" /> Alamat Pengiriman
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="name">Nama Penerima</Label>
                    <Input
                      id="name"
                      value={address.name}
                      onChange={(e) => setAddress({ ...address, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="phone">No. Handphone</Label>
                    <Input
                      id="phone"
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="street">Alamat Lengkap</Label>
                  <Textarea
                    id="street"
                    rows={2}
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label>Kota</Label>
                    <Input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Provinsi</Label>
                    <Input value={address.province} readOnly className="bg-gray-50" />
                  </div>
                  <div className="space-y-1">
                    <Label>Kode Pos</Label>
                    <Input
                      value={address.postal_code}
                      onChange={(e) => setAddress({ ...address, postal_code: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="h-4 w-4" /> Pengiriman
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Ongkos kirim akan dihitung otomatis berdasarkan berat dan lokasi.
                  Integrasi KirimAja segera hadir.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4" /> Ringkasan Pesanan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.product_id} className="flex justify-between text-sm">
                      <span className="text-gray-600 truncate flex-1 mr-2">
                        {item.name} x{item.quantity}
                      </span>
                      <span className="font-medium shrink-0">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span style={{ color: 'var(--color-tb-primary)' }}>{formatPrice(total())}</span>
                </div>
                <Button
                  className="mt-4 w-full"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={loading}
                >
                  {loading ? 'Memproses...' : 'Bayar Sekarang'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
