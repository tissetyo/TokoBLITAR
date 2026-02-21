import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { ShoppingCart } from 'lucide-react'

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
  const primaryImg = product.product_images?.find((i) => i.is_primary)
    || product.product_images?.[0]

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {primaryImg ? (
          <img
            src={primaryImg.url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ShoppingCart className="h-8 w-8 text-gray-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        {product.stores && (
          <p className="mb-1 text-xs text-gray-500 truncate">{product.stores.name}</p>
        )}
        <h3 className="text-sm font-medium leading-tight line-clamp-2">{product.name}</h3>
        <p className="mt-1.5 text-sm font-bold" style={{ color: 'var(--color-tb-primary)' }}>
          {formatPrice(product.price)}
        </p>
      </div>
    </Link>
  )
}
