'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/cartStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'
import { CreditCard, MapPin, Truck, Check } from 'lucide-react'
import { AreaSearch } from '@/components/ui/area-search'

interface Area {
  id: string
  name: string
}

interface ShippingRate {
  courier_code: string
  courier_name: string
  courier_service_code: string
  courier_service_name: string
  duration: string
  price: number
}

export default function CheckoutPage() {
  const router = useRouter()
  const items = useCartStore((s) => s.items)
  const total = useCartStore((s) => s.total)
  const clearCart = useCartStore((s) => s.clear)
  const [loading, setLoading] = useState(false)
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([])
  const [loadingRates, setLoadingRates] = useState(false)
  const [selectedShipping, setSelectedShipping] = useState<ShippingRate | null>(null)
  const [selectedArea, setSelectedArea] = useState<Area | null>(null)
  const [address, setAddress] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    province: '',
    postal_code: '', // we will keep postal code for the final UI but area_id drives the API
    area_id: '',
  })

  // Fetch initial address from profile
  useEffect(() => {
    async function loadProfile() {
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('users')
        .select('full_name, phone, street, city, province, postal_code, area_id')
        .eq('id', user.id)
        .returns<{
          full_name: string | null
          phone: string | null
          street: string | null
          city: string | null
          province: string | null
          postal_code: string | null
          area_id: string | null
        }[]>()
        .single()

      if (profile) {
        setAddress(prev => ({
          ...prev,
          name: profile.full_name || prev.name,
          phone: profile.phone || prev.phone,
          street: profile.street || prev.street,
          city: profile.city || prev.city,
          province: profile.province || prev.province,
          postal_code: profile.postal_code || prev.postal_code,
          area_id: profile.area_id || prev.area_id,
        }))

        if (profile.area_id && profile.city) {
          setSelectedArea({
            id: profile.area_id,
            name: `${profile.city}${profile.province ? `, ${profile.province}` : ''}`
          })
        }
      }
    }
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Whenever user selects an area, attempt to fetch rates automatically
  useEffect(() => {
    if (address.area_id) {
      fetchShippingRates()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address.area_id])

  if (items.length === 0) {
    router.push('/cart')
    return null
  }

  // Calculate total weight based on actual products in cart
  const totalWeight = Math.max(
    100, // minimum weight 100g to avoid 0g payload errors
    items.reduce((sum, item) => sum + ((item.weight_gram || 1000) * item.quantity), 0)
  )

  async function fetchShippingRates() {
    if (!address.area_id) return

    setLoadingRates(true)
    setSelectedShipping(null)
    try {
      const params = new URLSearchParams({
        destination_area_id: address.area_id,
        weight: totalWeight.toString(),
        value: total().toString(),
        store_id: items[0].store_id,
      })
      const res = await fetch(`/api/buyer/shipping?${params}`)
      const data = await res.json()

      if (res.ok && data.rates) {
        setShippingRates(data.rates)
      } else {
        toast.error(data.error || 'Gagal mendapatkan ongkir')
        setShippingRates([])
      }
    } catch {
      toast.error('Gagal menghubungi layanan pengiriman')
      setShippingRates([])
    } finally {
      setLoadingRates(false)
    }
  }

  const grandTotal = total() + (selectedShipping?.price || 0)

  async function handleCheckout() {
    if (!address.name || !address.phone || !address.street) {
      toast.error('Lengkapi alamat pengiriman')
      return
    }
    if (!selectedShipping) {
      toast.error('Pilih metode pengiriman')
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
          shipping: {
            courier: `${selectedShipping.courier_name} - ${selectedShipping.courier_service_name}`,
            cost: selectedShipping.price,
            duration: selectedShipping.duration,
          },
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
                <div className="space-y-1">
                  <AreaSearch
                    label="Wilayah Tujuan (Kecamatan / Kota)"
                    placeholder="Contoh: Sananwetan, Blitar..."
                    onSelect={(area) => {
                      if (area) {
                        setSelectedArea(area)
                        // Simple parser for name, e.g "Sananwetan, Blitar, Jawa Timur"
                        const parts = area.name.split(',').map(s => s.trim())
                        const city = parts.length > 1 ? parts[1] : area.name
                        const province = parts.length > 2 ? parts[2] : ''

                        setAddress({
                          ...address,
                          area_id: area.id,
                          city: city,
                          province: province,
                          // Optional: we don't have exact postal code from the area picker, but Biteship accepts area ID natively now.
                        })
                      } else {
                        setSelectedArea(null)
                        setAddress({ ...address, area_id: '', city: '', province: '' })
                        setShippingRates([])
                      }
                    }}
                    defaultValue={selectedArea}
                  />
                </div>

                {selectedArea && (
                  <div className="grid gap-3 sm:grid-cols-2 mt-4">
                    <div className="space-y-1">
                      <Label>Kota/Kabupaten</Label>
                      <Input value={address.city} readOnly className="bg-gray-50" />
                    </div>
                    <div className="space-y-1">
                      <Label>Provinsi</Label>
                      <Input value={address.province} readOnly className="bg-gray-50" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping — Biteship */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="h-4 w-4" /> Pilih Pengiriman
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!address.area_id ? (
                  <p className="text-sm text-gray-500">
                    Pilih wilayah tujuan penerima untuk melihat pilihan kurir.
                  </p>
                ) : loadingRates ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                  </div>
                ) : shippingRates.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">Belum ada tarif. Ketik kode pos lalu klik di luar field.</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={fetchShippingRates}>
                      Cek Ongkir
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {shippingRates.map((rate, i) => (
                      <button
                        key={`${rate.courier_code}-${rate.courier_service_code}-${i}`}
                        type="button"
                        onClick={() => setSelectedShipping(rate)}
                        className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${selectedShipping?.courier_service_code === rate.courier_service_code &&
                          selectedShipping?.courier_code === rate.courier_code
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:bg-gray-50'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          {selectedShipping?.courier_service_code === rate.courier_service_code &&
                            selectedShipping?.courier_code === rate.courier_code && (
                              <Check className="h-4 w-4 text-blue-600" />
                            )}
                          <div>
                            <p className="text-sm font-medium">
                              {rate.courier_name} — {rate.courier_service_name}
                            </p>
                            <p className="text-xs text-gray-500">{rate.duration}</p>
                          </div>
                        </div>
                        <p className="text-sm font-bold">{formatPrice(rate.price)}</p>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-6">
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
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{formatPrice(total())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ongkir</span>
                    <span>
                      {selectedShipping
                        ? formatPrice(selectedShipping.price)
                        : '—'}
                    </span>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span style={{ color: 'var(--color-tb-primary)' }}>
                    {formatPrice(grandTotal)}
                  </span>
                </div>
                <Button
                  className="mt-4 w-full"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={loading || !selectedShipping}
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
