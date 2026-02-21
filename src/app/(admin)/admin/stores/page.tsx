'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { Store, Star, StarOff, Ban } from 'lucide-react'

interface StoreItem {
  id: string
  name: string
  slug: string
  status: string
  is_featured: boolean
  created_at: string
  users: { full_name: string; email: string }
}

export default function AdminStoresPage() {
  const [stores, setStores] = useState<StoreItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStores() }, [])

  async function fetchStores() {
    setLoading(true)
    const res = await fetch('/api/admin/stores')
    const data = await res.json()
    setStores(data.stores || [])
    setLoading(false)
  }

  async function toggleFeature(id: string, featured: boolean) {
    await fetch('/api/admin/stores', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_featured: !featured }),
    })
    toast.success(featured ? 'Batal unggulan' : 'Ditandai unggulan')
    fetchStores()
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Kelola Toko</h1>
        <p className="text-sm text-gray-500">Fitur dan kelola semua toko di platform</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {stores.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg text-white font-bold" style={{ backgroundColor: 'var(--color-tb-primary)' }}>
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.users?.full_name} • {s.slug} • {formatDate(s.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={s.status === 'active' ? 'default' : 'secondary'}>{s.status}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => toggleFeature(s.id, s.is_featured)}>
                    {s.is_featured ? <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> : <StarOff className="h-4 w-4 text-gray-400" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
