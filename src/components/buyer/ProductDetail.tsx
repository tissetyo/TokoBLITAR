'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/lib/utils'
import { ShoppingCart, Minus, Plus, Store, MapPin, Check } from 'lucide-react'
import { toast } from 'sonner'

interface ProductDetailProps {
    product: {
        id: string
        name: string
        description: string | null
        price: number
        stock: number
        weight_gram: number
        status: string
        product_images: { id: string; url: string; is_primary: boolean; sort_order: number }[]
        stores: {
            id: string
            name: string
            slug: string
            logo_url: string | null
            description: string | null
            address: string | null
        }
    }
}

export function ProductDetail({ product }: ProductDetailProps) {
    const [selectedImage, setSelectedImage] = useState(0)
    const [qty, setQty] = useState(1)
    const [added, setAdded] = useState(false)
    const addItem = useCartStore((s) => s.addItem)

    const sortedImages = [...product.product_images].sort((a, b) => {
        if (a.is_primary) return -1
        if (b.is_primary) return 1
        return a.sort_order - b.sort_order
    })

    function handleAddToCart() {
        addItem({
            product_id: product.id,
            name: product.name,
            price: product.price,
            quantity: qty,
            image_url: sortedImages[0]?.url || '',
        })
        setAdded(true)
        toast.success('Ditambahkan ke keranjang!')
        setTimeout(() => setAdded(false), 2000)
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Image Gallery */}
                    <div className="space-y-3">
                        <div className="aspect-square overflow-hidden rounded-xl border bg-white">
                            {sortedImages.length > 0 ? (
                                <img
                                    src={sortedImages[selectedImage]?.url}
                                    alt={product.name}
                                    className="h-full w-full object-contain"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center">
                                    <ShoppingCart className="h-16 w-16 text-gray-200" />
                                </div>
                            )}
                        </div>
                        {sortedImages.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {sortedImages.map((img, i) => (
                                    <button
                                        key={img.id}
                                        onClick={() => setSelectedImage(i)}
                                        className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${i === selectedImage ? 'border-blue-500' : 'border-transparent'
                                            }`}
                                        style={i === selectedImage ? { borderColor: 'var(--color-tb-primary)' } : undefined}
                                    >
                                        <img src={img.url} alt="" className="h-full w-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-2xl font-bold lg:text-3xl">{product.name}</h1>
                            <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--color-tb-primary)' }}>
                                {formatPrice(product.price)}
                            </p>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Stok: <strong>{product.stock}</strong></span>
                            <span>Berat: <strong>{product.weight_gram}g</strong></span>
                        </div>

                        {/* Qty + Add to Cart */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center rounded-lg border">
                                <button
                                    className="p-2 hover:bg-gray-100"
                                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                                >
                                    <Minus className="h-4 w-4" />
                                </button>
                                <span className="w-12 text-center text-sm font-medium">{qty}</span>
                                <button
                                    className="p-2 hover:bg-gray-100"
                                    onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                            <Button
                                size="lg"
                                className="flex-1"
                                onClick={handleAddToCart}
                                disabled={product.stock === 0}
                            >
                                {added ? (
                                    <><Check className="mr-2 h-4 w-4" /> Ditambahkan!</>
                                ) : (
                                    <><ShoppingCart className="mr-2 h-4 w-4" /> Tambah ke Keranjang</>
                                )}
                            </Button>
                        </div>

                        <Separator />

                        {/* Description */}
                        {product.description && (
                            <div>
                                <h3 className="mb-2 font-semibold">Deskripsi</h3>
                                <p className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                                    {product.description}
                                </p>
                            </div>
                        )}

                        <Separator />

                        {/* Store Info */}
                        <Link
                            href={`/store/${product.stores.slug}`}
                            className="flex items-center gap-4 rounded-xl border p-4 transition-shadow hover:shadow-md"
                        >
                            <div
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-lg font-bold text-white"
                                style={{ backgroundColor: 'var(--color-tb-primary)' }}
                            >
                                {product.stores.logo_url ? (
                                    <img src={product.stores.logo_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                                ) : (
                                    product.stores.name.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-medium flex items-center gap-2">
                                    <Store className="h-4 w-4" />
                                    {product.stores.name}
                                </p>
                                {product.stores.address && (
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                        <MapPin className="h-3 w-3" />
                                        {product.stores.address}
                                    </p>
                                )}
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    )
}
