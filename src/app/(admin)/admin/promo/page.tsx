'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils'
import { Ticket, Plus, X } from 'lucide-react'

export default function AdminPromoPage() {
  const [promos, setPromos] = useState<{ id: string; code: string; discount_percent: number; min_order_amount: number; is_active: boolean }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Placeholder — admin-level promo management
    setLoading(false)
  }, [])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Promo Platform</h1>
        <p className="text-sm text-gray-500">Kelola promo untuk seluruh platform TokoBLITAR</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : promos.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-500">
          <Ticket className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p>Belum ada promo platform</p>
          <p className="text-xs mt-1">Promo platform berlaku untuk semua toko di TokoBLITAR</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {promos.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-mono font-bold">{p.code}</p>
                  <p className="text-xs text-gray-500">Diskon {p.discount_percent}% • Min {formatPrice(p.min_order_amount)}</p>
                </div>
                <Switch checked={p.is_active} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
