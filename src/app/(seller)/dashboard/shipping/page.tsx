'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatPrice } from '@/lib/utils'
import { Package, Truck, Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { BiteshipCourier } from '@/lib/biteship'

interface Shipment {
  id: string
  order_id: string
  courier: string
  tracking_code: string | null
  status: string
  estimated_delivery: string | null
  created_at: string
}

export default function ShippingPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)

  // Manual Check States
  const [originPostal, setOriginPostal] = useState('66171')
  const [destinationPostal, setDestinationPostal] = useState('')
  const [weight, setWeight] = useState('1000') // in grams
  const [checkingRates, setCheckingRates] = useState(false)
  const [rates, setRates] = useState<BiteshipCourier[]>([])

  async function handleCheckRates(e: React.FormEvent) {
    e.preventDefault()
    if (!originPostal || !destinationPostal || !weight) return

    setCheckingRates(true)
    setRates([])
    try {
      const params = new URLSearchParams({
        origin_postal_code: originPostal,
        destination_postal_code: destinationPostal,
        weight: weight,
        couriers: 'jne,jnt,sicepat,anteraja,pos,tiki', // manual check checks all
        items: JSON.stringify([{ name: 'Paket Reguler', weight: parseInt(weight), quantity: 1, value: 50000 }])
      })

      const res = await fetch(`/api/seller/shipping/check?${params}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengecek tarif')
      }

      setRates(data.rates || [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengecek ongkir')
    } finally {
      setCheckingRates(false)
    }
  }

  useEffect(() => {
    // In production, fetch from /api/seller/shipments
    // For now, show placeholder
    setLoading(false)
  }, [])

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    picked_up: 'bg-blue-100 text-blue-800',
    in_transit: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Pengiriman</h1>
        <p className="text-sm text-gray-500">Kelola pengiriman pesanan dan cek ongkir Biteship</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Col: Cek Ongkir Manual */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-4 w-4" /> Cek Ongkir Manual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCheckRates} className="space-y-4">
                <div className="space-y-2">
                  <Label>Kodepos Asal</Label>
                  <Input
                    value={originPostal}
                    onChange={e => setOriginPostal(e.target.value)}
                    placeholder="Contoh: 66171"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kodepos Tujuan</Label>
                  <Input
                    value={destinationPostal}
                    onChange={e => setDestinationPostal(e.target.value)}
                    placeholder="Contoh: 12345"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Berat (Gram)</Label>
                  <Input
                    type="number"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    min="100"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={checkingRates}>
                  {checkingRates ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Cek Tarif
                </Button>
              </form>

              {rates.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hasil Pengecekan</h4>
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                    {rates.map((rate, i) => (
                      <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border text-sm">
                        <div>
                          <p className="font-medium">{rate.courier_name}</p>
                          <p className="text-xs text-gray-500">{rate.courier_service_name} • {rate.duration}</p>
                        </div>
                        <p className="font-bold text-blue-600">{formatPrice(rate.price)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Shipments List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-lg">Daftar Pengiriman Aktif</h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
            </div>
          ) : shipments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <Truck className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                <p>Belum ada pengiriman aktif</p>
                <p className="text-xs mt-1">Pesanan yang sudah dibayar akan muncul di sini</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {shipments.map((s) => (
                <Card key={s.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Order #{s.order_id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500">
                          {s.courier} • {s.tracking_code || 'No resi belum ada'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={statusColor[s.status] || ''}>{s.status}</Badge>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(s.created_at)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
