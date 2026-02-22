'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, ImageIcon, FileText, Tags, Loader2, Check, X, Upload, Eraser, ZoomIn, Wand2 } from 'lucide-react'
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

    // Photo enhancement state
    const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null)
    const [enhancedPhoto, setEnhancedPhoto] = useState<string | null>(null)
    const [showOriginal, setShowOriginal] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

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

    // Compress image to fit API limits
    function compressImage(dataUrl: string, maxSize: number = 800): Promise<string> {
        return new Promise((resolve) => {
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                let { width, height } = img
                if (width > maxSize || height > maxSize) {
                    if (width > height) {
                        height = Math.round((height * maxSize) / width)
                        width = maxSize
                    } else {
                        width = Math.round((width * maxSize) / height)
                        height = maxSize
                    }
                }
                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext('2d')!
                ctx.drawImage(img, 0, 0, width, height)
                resolve(canvas.toDataURL('image/jpeg', 0.85))
            }
            img.src = dataUrl
        })
    }

    // Handle file upload for enhancement
    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error('File harus berupa gambar')
            return
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('Ukuran file maksimal 10MB')
            return
        }

        const reader = new FileReader()
        reader.onload = async () => {
            const compressed = await compressImage(reader.result as string)
            setUploadedPhoto(compressed)
            setEnhancedPhoto(null)
            setShowOriginal(false)
        }
        reader.readAsDataURL(file)
        e.target.value = ''
    }

    // Enhance uploaded photo
    async function enhancePhoto(action: 'remove_bg' | 'upscale' | 'enhance') {
        if (!uploadedPhoto) return

        setLoading(`enhance_${action}`)
        try {
            // Extract base64 from data URL
            const base64 = uploadedPhoto.split(',')[1]

            const res = await fetch('/api/seller/products/enhance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image_base64: base64, action }),
            })

            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || 'Gagal enhance foto')
                if (res.status === 503) {
                    toast.info('Coba lagi dalam beberapa detik...')
                }
                return
            }

            setEnhancedPhoto(data.result)
            toast.success(
                action === 'remove_bg' ? 'Background berhasil dihapus!' :
                    action === 'upscale' ? 'Foto berhasil di-upscale!' :
                        'Foto berhasil di-enhance!'
            )
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
                {/* ===== PHOTO ENHANCEMENT SECTION ===== */}
                <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">📸 Enhance Foto Produk</p>

                    {!uploadedPhoto ? (
                        <div
                            className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-blue-200 bg-white/80 px-4 py-6 transition-colors hover:border-blue-400 hover:bg-blue-50/50"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="h-8 w-8 text-blue-400" />
                            <span className="text-sm font-medium text-gray-600">Upload foto mentah</span>
                            <span className="text-xs text-gray-400">AI akan perbagus jadi foto display profesional</span>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Photo preview */}
                            <div className="relative overflow-hidden rounded-lg border bg-white">
                                <img
                                    src={enhancedPhoto && !showOriginal ? enhancedPhoto : uploadedPhoto}
                                    alt={enhancedPhoto && !showOriginal ? 'Enhanced' : 'Original'}
                                    className="w-full object-contain"
                                    style={{ maxHeight: 250 }}
                                />
                                <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                                    {enhancedPhoto && !showOriginal ? '✨ HASIL AI' : '📷 ASLI'}
                                </span>
                                {enhancedPhoto && (
                                    <button
                                        type="button"
                                        onClick={() => setShowOriginal(!showOriginal)}
                                        className="absolute right-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white hover:bg-black/80"
                                    >
                                        {showOriginal ? 'Lihat Hasil' : 'Lihat Asli'}
                                    </button>
                                )}
                            </div>

                            {/* Enhancement action buttons */}
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-auto flex-col gap-1 py-2 text-[10px] hover:bg-orange-50 hover:border-orange-200"
                                    onClick={() => enhancePhoto('remove_bg')}
                                    disabled={loading !== null}
                                >
                                    {loading === 'enhance_remove_bg' ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                                    ) : (
                                        <Eraser className="h-4 w-4 text-orange-500" />
                                    )}
                                    Hapus BG
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-auto flex-col gap-1 py-2 text-[10px] hover:bg-cyan-50 hover:border-cyan-200"
                                    onClick={() => enhancePhoto('upscale')}
                                    disabled={loading !== null}
                                >
                                    {loading === 'enhance_upscale' ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-cyan-500" />
                                    ) : (
                                        <ZoomIn className="h-4 w-4 text-cyan-500" />
                                    )}
                                    Upscale
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-auto flex-col gap-1 py-2 text-[10px] hover:bg-violet-50 hover:border-violet-200"
                                    onClick={() => enhancePhoto('enhance')}
                                    disabled={loading !== null}
                                >
                                    {loading === 'enhance_enhance' ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                                    ) : (
                                        <Wand2 className="h-4 w-4 text-violet-500" />
                                    )}
                                    Full Enhance
                                </Button>
                            </div>

                            {/* Accept / Reset */}
                            <div className="flex gap-2">
                                {enhancedPhoto && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => {
                                            onImageGenerated(enhancedPhoto)
                                            setUploadedPhoto(null)
                                            setEnhancedPhoto(null)
                                            toast.success('Foto ditambahkan!')
                                        }}
                                    >
                                        <Check className="mr-1 h-3 w-3" /> Gunakan Hasil
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setUploadedPhoto(null)
                                        setEnhancedPhoto(null)
                                    }}
                                >
                                    <X className="mr-1 h-3 w-3" /> Reset
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-t" />

                {/* ===== GENERATE SECTION ===== */}
                <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">✍️ Generate Konten</p>
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
                        {loading.startsWith('enhance') ? '⏳ Memproses foto... (~15 detik)' :
                            loading === 'image' ? '⏳ Membuat foto... (~10 detik)' : '⏳ Generating...'}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
