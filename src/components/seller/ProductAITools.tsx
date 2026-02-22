'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, ImageIcon, FileText, Tags, Loader2, Check, X } from 'lucide-react'
import { toast } from 'sonner'

interface ProductAIToolsProps {
    productName: string
    productDescription: string
    category: string
    onDescriptionGenerated: (desc: string) => void
    onImageGenerated: (url: string) => void
    onCategorySelected: (cat: string) => void
}

export function ProductAITools({
    productName,
    productDescription,
    category,
    onDescriptionGenerated,
    onImageGenerated,
    onCategorySelected,
}: ProductAIToolsProps) {
    const [loading, setLoading] = useState<string | null>(null)
    const [generatedDesc, setGeneratedDesc] = useState<string | null>(null)
    const [generatedImage, setGeneratedImage] = useState<string | null>(null)
    const [suggestedCategories, setSuggestedCategories] = useState<string[]>([])

    async function generate(type: 'image' | 'description' | 'category') {
        if (!productName.trim()) {
            toast.error('Isi nama produk terlebih dahulu')
            return
        }

        setLoading(type)
        try {
            const res = await fetch('/api/seller/products/ai-generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    product_name: productName,
                    product_description: productDescription,
                    category,
                }),
            })

            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || 'Gagal generate')
                return
            }

            if (type === 'description') {
                setGeneratedDesc(data.result)
                toast.success('Deskripsi berhasil di-generate!')
            } else if (type === 'image') {
                setGeneratedImage(data.result)
                toast.success('Foto berhasil di-generate!')
            } else if (type === 'category') {
                try {
                    // Extract JSON array from response
                    const match = data.result.match(/\[[\s\S]*\]/)
                    if (match) {
                        const cats = JSON.parse(match[0])
                        setSuggestedCategories(cats)
                        toast.success('Kategori disarankan!')
                    }
                } catch {
                    toast.error('Gagal parsing saran kategori')
                }
            }
        } catch {
            toast.error('Terjadi kesalahan')
        } finally {
            setLoading(null)
        }
    }

    return (
        <Card className="border-blue-100 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-900">AI Tools</span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-600">BETA</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Action buttons */}
                <div className="grid grid-cols-3 gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-auto flex-col gap-1.5 py-3 text-xs hover:bg-blue-50 hover:border-blue-200"
                        onClick={() => generate('image')}
                        disabled={loading !== null}
                    >
                        {loading === 'image' ? (
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                        ) : (
                            <ImageIcon className="h-5 w-5 text-blue-500" />
                        )}
                        Generate Foto
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-auto flex-col gap-1.5 py-3 text-xs hover:bg-purple-50 hover:border-purple-200"
                        onClick={() => generate('description')}
                        disabled={loading !== null}
                    >
                        {loading === 'description' ? (
                            <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                        ) : (
                            <FileText className="h-5 w-5 text-purple-500" />
                        )}
                        Generate Deskripsi
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-auto flex-col gap-1.5 py-3 text-xs hover:bg-green-50 hover:border-green-200"
                        onClick={() => generate('category')}
                        disabled={loading !== null}
                    >
                        {loading === 'category' ? (
                            <Loader2 className="h-5 w-5 animate-spin text-green-500" />
                        ) : (
                            <Tags className="h-5 w-5 text-green-500" />
                        )}
                        Saran Kategori
                    </Button>
                </div>

                {/* Generated image preview */}
                {generatedImage && (
                    <div className="space-y-2 rounded-lg border bg-white p-3">
                        <p className="text-xs font-medium text-gray-500">📸 Foto AI Generated</p>
                        <img
                            src={generatedImage}
                            alt="AI Generated"
                            className="w-full rounded-lg object-contain"
                            style={{ maxHeight: 300 }}
                        />
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                    onImageGenerated(generatedImage)
                                    setGeneratedImage(null)
                                    toast.success('Foto ditambahkan!')
                                }}
                            >
                                <Check className="mr-1 h-3 w-3" /> Gunakan
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setGeneratedImage(null)}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Generated description preview */}
                {generatedDesc && (
                    <div className="space-y-2 rounded-lg border bg-white p-3">
                        <p className="text-xs font-medium text-gray-500">📝 Deskripsi AI Generated</p>
                        <p className="whitespace-pre-wrap text-sm text-gray-700">{generatedDesc}</p>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                    onDescriptionGenerated(generatedDesc)
                                    setGeneratedDesc(null)
                                    toast.success('Deskripsi diterapkan!')
                                }}
                            >
                                <Check className="mr-1 h-3 w-3" /> Gunakan
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setGeneratedDesc(null)}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Suggested categories */}
                {suggestedCategories.length > 0 && (
                    <div className="space-y-2 rounded-lg border bg-white p-3">
                        <p className="text-xs font-medium text-gray-500">🏷️ Saran Kategori</p>
                        <div className="flex flex-wrap gap-2">
                            {suggestedCategories.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 transition-colors hover:bg-green-100"
                                    onClick={() => {
                                        onCategorySelected(cat)
                                        setSuggestedCategories([])
                                        toast.success(`Kategori "${cat}" dipilih`)
                                    }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {loading && (
                    <p className="text-center text-xs text-gray-400">
                        {loading === 'image' ? '⏳ Membuat foto... (~10 detik)' : '⏳ Generating...'}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
