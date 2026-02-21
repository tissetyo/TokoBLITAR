'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import { Package, Truck } from 'lucide-react'

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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Pengiriman</h1>
        <p className="text-sm text-gray-500">Kelola pengiriman pesanan via Biteship</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
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
  )
}
