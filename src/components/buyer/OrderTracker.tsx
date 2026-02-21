'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatPrice, formatDate } from '@/lib/utils'
import {
  Clock,
  CreditCard,
  Package,
  Truck,
  CheckCircle,
  XCircle,
} from 'lucide-react'

interface OrderTrackerProps {
  order: {
    id: string
    status: string
    total_amount: number
    discount_amount: number
    created_at: string
    shipping_address: { name: string; phone: string; street: string; city?: string }
    stores: { name: string }
    order_items: {
      id: string
      quantity: number
      unit_price: number
      subtotal: number
      products: { name: string; product_images: { url: string; is_primary: boolean }[] }
    }[]
    shipments: {
      courier: string
      tracking_code: string | null
      status: string
      estimated_delivery: string | null
    }[]
  }
}

const statusSteps = [
  { key: 'pending', label: 'Menunggu Pembayaran', icon: Clock },
  { key: 'paid', label: 'Dibayar', icon: CreditCard },
  { key: 'processing', label: 'Diproses', icon: Package },
  { key: 'shipped', label: 'Dikirim', icon: Truck },
  { key: 'delivered', label: 'Diterima', icon: CheckCircle },
]

const statusOrder = ['pending', 'paid', 'processing', 'shipped', 'delivered']

export function OrderTracker({ order }: OrderTrackerProps) {
  const currentIndex = statusOrder.indexOf(order.status)
  const isCancelled = order.status === 'cancelled' || order.status === 'refunded'

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Pesanan #{order.id.slice(0, 8)}</h1>
            <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
          </div>
          <Badge className={statusColor[order.status] || 'bg-gray-100'}>
            {order.status}
          </Badge>
        </div>

        {/* Stepper */}
        {!isCancelled && (
          <Card className="mb-6">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                {statusSteps.map((step, i) => {
                  const isComplete = i <= currentIndex
                  const isCurrent = i === currentIndex
                  return (
                    <div key={step.key} className="flex flex-1 flex-col items-center gap-2">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${isComplete
                            ? 'text-white'
                            : 'bg-gray-200 text-gray-400'
                          }`}
                        style={isComplete ? { backgroundColor: 'var(--color-tb-primary)' } : undefined}
                      >
                        <step.icon className="h-5 w-5" />
                      </div>
                      <span className={`text-xs text-center ${isCurrent ? 'font-bold' : 'text-gray-500'}`}>
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {isCancelled && (
          <Card className="mb-6 border-red-200">
            <CardContent className="flex items-center gap-3 py-4 text-red-600">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">
                Pesanan {order.status === 'cancelled' ? 'dibatalkan' : 'direfund'}
              </span>
            </CardContent>
          </Card>
        )}

        {/* Shipping */}
        {order.shipments && order.shipments.length > 0 && (
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-base">Pengiriman</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Kurir: <strong>{order.shipments[0].courier}</strong></p>
              {order.shipments[0].tracking_code && (
                <p>No. Resi: <strong>{order.shipments[0].tracking_code}</strong></p>
              )}
              {order.shipments[0].estimated_delivery && (
                <p>Estimasi: <strong>{formatDate(order.shipments[0].estimated_delivery)}</strong></p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Item Pesanan • {order.stores.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.order_items.map((item) => {
              const primaryImg = item.products?.product_images?.find((i) => i.is_primary)
                || item.products?.product_images?.[0]
              return (
                <div key={item.id} className="flex gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded bg-gray-100">
                    {primaryImg && <img src={primaryImg.url} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.products?.name}</p>
                    <p className="text-xs text-gray-500">{item.quantity} x {formatPrice(item.unit_price)}</p>
                  </div>
                  <p className="text-sm font-medium">{formatPrice(item.subtotal)}</p>
                </div>
              )
            })}
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span style={{ color: 'var(--color-tb-primary)' }}>{formatPrice(order.total_amount)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader><CardTitle className="text-base">Alamat Pengiriman</CardTitle></CardHeader>
          <CardContent className="text-sm">
            <p className="font-medium">{order.shipping_address?.name}</p>
            <p className="text-gray-600">{order.shipping_address?.phone}</p>
            <p className="text-gray-600">{order.shipping_address?.street}</p>
            {order.shipping_address?.city && (
              <p className="text-gray-600">{order.shipping_address.city}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
