'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag } from 'lucide-react'

interface ProductCardProps {
  product: {
    id: string
    name: string
    price: number
    stores?: { name: string; slug: string }
    product_images?: { url: string; is_primary: boolean }[]
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const primaryImage = product.product_images?.find((img) => img.is_primary) || product.product_images?.[0]

  return (
    <Link
      href={`/products/${product.id}`}
      className="group overflow-hidden rounded-xl border bg-white transition-all hover:shadow-lg hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ShoppingBag className="h-10 w-10 text-gray-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        {product.stores && (
          <p className="mb-0.5 text-xs font-medium text-blue-600">{product.stores.name}</p>
        )}
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-tight group-hover:text-blue-700 transition-colors">
          {product.name}
        </h3>
        <p className="mt-2 text-base font-bold" style={{ color: 'var(--color-tb-accent)' }}>
          Rp {product.price.toLocaleString('id-ID')}
        </p>
      </div>
    </Link>
  )
}
