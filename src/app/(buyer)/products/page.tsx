'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProductCard } from '@/components/buyer/ProductCard'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, SlidersHorizontal } from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  stores: { name: string; slug: string }
  product_images: { url: string; is_primary: boolean }[]
}

interface Category {
  id: string
  name: string
  slug: string
}

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || '')

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: page.toString(), limit: '12' })
    if (search) params.set('q', search)
    if (activeCategory) params.set('category_id', activeCategory)

    const res = await fetch(`/api/buyer/products?${params}`)
    const data = await res.json()
    setProducts(data.products || [])
    setTotalPages(data.pagination?.totalPages || 1)
    setLoading(false)
  }, [page, search, activeCategory])

  useEffect(() => {
    // Fetch categories once
    fetch('/api/buyer/products?limit=0')
      .catch(() => { })
    // Actually fetch categories from a simple endpoint
    const fetchCats = async () => {
      const res = await fetch('/api/buyer/products?limit=0')
      // Categories are separate — just hardcode the 6 for now
    }
    fetchCats()
  }, [])

  // Fetch categories from products page load
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await fetch('/api/buyer/categories')
        const data = await res.json()
        setCategories(data.categories || [])
      } catch {
        // Categories API might not exist yet, use empty
      }
    }
    fetchCats()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    fetchProducts()
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk UMKM Blitar..."
              className="h-12 pl-12 text-base"
            />
          </div>
        </form>

        {/* Category filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Badge
            variant={activeCategory === '' ? 'default' : 'outline'}
            className="cursor-pointer px-3 py-1.5"
            onClick={() => { setActiveCategory(''); setPage(1) }}
          >
            Semua
          </Badge>
          {categories.map((cat) => (
            <Badge
              key={cat.id}
              variant={activeCategory === cat.id ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1.5"
              onClick={() => { setActiveCategory(cat.id); setPage(1) }}
            >
              {cat.name}
            </Badge>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          ) : products.length === 0 ? (
            <div className="col-span-full py-20 text-center text-gray-500">
              <SlidersHorizontal className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-lg font-medium">Produk tidak ditemukan</p>
              <p className="text-sm">Coba ubah kata kunci atau filter Anda</p>
            </div>
          ) : (
            products.map((p) => <ProductCard key={p.id} product={p} />)
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Sebelumnya
            </Button>
            <span className="text-sm text-gray-500">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Selanjutnya
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
