'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { formatPrice, formatDate } from '@/lib/utils'
import { Package, Star, StarOff, Trash2 } from 'lucide-react'

interface ProductItem {
  id: string
  name: string
  price: number
  status: string
  is_featured: boolean
  created_at: string
  stores: { name: string }
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchProducts() }, [])

  async function fetchProducts() {
    setLoading(true)
    const res = await fetch('/api/admin/products')
    const data = await res.json()
    setProducts(data.products || [])
    setLoading(false)
  }

  async function toggleFeature(id: string, featured: boolean) {
    await fetch('/api/admin/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_featured: !featured }),
    })
    toast.success(featured ? 'Batal unggulan' : 'Ditandai unggulan')
    fetchProducts()
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus produk ini?')) return
    await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' })
    toast.success('Produk dihapus')
    fetchProducts()
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Kelola Produk</h1>
        <p className="text-sm text-gray-500">Fitur dan kelola semua produk di platform</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-gray-500">
                    {p.stores?.name} • {formatPrice(p.price)} • {formatDate(p.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>{p.status}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => toggleFeature(p.id, p.is_featured)}>
                    {p.is_featured ? <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> : <StarOff className="h-4 w-4 text-gray-400" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
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
