'use client'

import Link from 'next/link'
import { useCartStore } from '@/store/cartStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { formatPrice } from '@/lib/utils'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'

export default function CartPage() {
  const items = useCartStore((s) => s.items)
  const updateQty = useCartStore((s) => s.updateQty)
  const removeItem = useCartStore((s) => s.removeItem)
  const total = useCartStore((s) => s.total)

  if (items.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
        <ShoppingBag className="mb-4 h-16 w-16 text-gray-300" />
        <h1 className="text-xl font-bold">Keranjang Kosong</h1>
        <p className="mt-1 text-sm text-gray-500">Yuk, mulai belanja produk UMKM Blitar!</p>
        <Button asChild className="mt-6">
          <Link href="/products">Jelajahi Produk</Link>
        </Button>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-bold">Keranjang Belanja</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Items */}
          <div className="space-y-3 lg:col-span-2">
            {items.map((item) => (
              <div key={item.product_id} className="flex gap-4 rounded-xl border bg-white p-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {item.image_url && (
                    <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm font-bold" style={{ color: 'var(--color-tb-primary)' }}>
                      {formatPrice(item.price)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center rounded border">
                      <button
                        className="p-1.5 hover:bg-gray-100"
                        onClick={() => updateQty(item.product_id, Math.max(1, item.quantity - 1))}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        className="p-1.5 hover:bg-gray-100"
                        onClick={() => updateQty(item.product_id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="rounded-xl border bg-white p-5">
            <h2 className="mb-4 font-semibold">Ringkasan</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal ({items.length} item)</span>
                <span className="font-medium">{formatPrice(total())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ongkir</span>
                <span className="text-gray-500">Dihitung saat checkout</span>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span style={{ color: 'var(--color-tb-primary)' }}>{formatPrice(total())}</span>
            </div>
            <Button asChild className="mt-4 w-full" size="lg">
              <Link href="/checkout">
                Checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
