'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, ImageIcon, FileText, Tags, Loader2, Check, X, Upload, Eraser, ZoomIn, Wand2, ExternalLink } from 'lucide-react'
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
    const [userInstruction, setUserInstruction] = useState('')
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
                body: JSON.stringify({ type, product_name: productName, product_description: productDescription, category }),
            })

            const data = await res.json()
            if (!res.ok) { toast.error(data.error || 'Gagal generate'); return }

            if (type === 'description') { setGeneratedDesc(data.result); toast.success('Deskripsi berhasil di-generate!') }
            else if (type === 'image') { setGeneratedImage(data.result); toast.success('Foto berhasil di-generate!') }
            else if (type === 'category') {
                try {
                    const match = data.result.match(/\[[\s\S]*\]/)
                    if (match) { setSuggestedCategories(JSON.parse(match[0])); toast.success('Kategori disarankan!') }
                } catch { toast.error('Gagal parsing saran kategori') }
            }
        } catch { toast.error('Terjadi kesalahan') }
        finally { setLoading(null) }
    }

    // Compress image before sending
    function compressImage(dataUrl: string, maxSize = 800): Promise<string> {
        return new Promise((resolve) => {
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                let { width, height } = img
                if (width > maxSize || height > maxSize) {
                    if (width > height) { height = Math.round((height * maxSize) / width); width = maxSize }
                    else { width = Math.round((width * maxSize) / height); height = maxSize }
                }
                canvas.width = width; canvas.height = height
                const ctx = canvas.getContext('2d')!
                ctx.drawImage(img, 0, 0, width, height)
                resolve(canvas.toDataURL('image/jpeg', 0.85))
            }
            img.src = dataUrl
        })
    }

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) { toast.error('File harus berupa gambar'); return }
        if (file.size > 10 * 1024 * 1024) { toast.error('Ukuran file maksimal 10MB'); return }

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

    async function enhancePhoto(action: 'remove_bg' | 'upscale' | 'enhance' | 'studio_background' | 'inpaint') {
        if (!uploadedPhoto) return
        setLoading(`enhance_${action}`)
        try {
            const base64 = uploadedPhoto.split(',')[1]

            if (action === 'inpaint') {
                // Step 1: Remove Background to isolate the object
                toast.info('Mensolasi produk (1/3)...')
                const bgRes = await fetch('/api/seller/products/enhance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image_base64: base64, action: 'remove_bg' }),
                })
                const bgData = await bgRes.json()
                if (!bgRes.ok) throw new Error(bgData.error || 'Gagal menghapus background')

                // Step 2: Generate Mask from transparent image
                toast.info('Membuat cetakan masking (2/3)...')
                const transparentBase64 = bgData.result
                const img = new Image()
                img.src = transparentBase64
                await new Promise(res => { img.onload = res })

                const canvas = document.createElement('canvas')
                canvas.width = img.width
                canvas.height = img.height
                const ctx = canvas.getContext('2d')!

                // Draw the transparent image
                ctx.drawImage(img, 0, 0)

                // Create Black & White mask (Black = Preserve Object, White = Inpaint Background)
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                const data = imgData.data
                for (let i = 0; i < data.length; i += 4) {
                    if (data[i + 3] > 10) { // Opaque: This is the product -> BLACK
                        data[i] = 0
                        data[i + 1] = 0
                        data[i + 2] = 0
                        data[i + 3] = 255
                    } else { // Transparent: This is the background -> WHITE
                        data[i] = 255
                        data[i + 1] = 255
                        data[i + 2] = 255
                        data[i + 3] = 255
                    }
                }
                ctx.putImageData(imgData, 0, 0)
                const maskBase64 = canvas.toDataURL('image/png')

                // Step 3: Call Inpainting API
                toast.info('Me-render latar AI (3/3)...')
                const inpaintRes = await fetch('/api/seller/products/enhance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image_base64: base64,
                        mask_base64: maskBase64,
                        action: 'inpaint',
                        promptText: userInstruction
                    }),
                })
                const inpaintData = await inpaintRes.json()
                if (!inpaintRes.ok) throw new Error(inpaintData.error || 'Gagal membuat AI background')

                // Final Step: Overlay the transparent product on top of the new AI background to ensure 100% pixel perfection
                const finalBgImg = new Image()
                finalBgImg.src = inpaintData.result
                await new Promise(res => { finalBgImg.onload = res })

                ctx.clearRect(0, 0, canvas.width, canvas.height)
                ctx.drawImage(finalBgImg, 0, 0, canvas.width, canvas.height) // AI Background
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height) // 100% Original Transparent Product

                const perfectResult = canvas.toDataURL('image/png')
                setEnhancedPhoto(perfectResult)
                toast.success('Foto 100% Asli dengan Latar AI berhasil dibuat!')
                setLoading(null)
                return;
            }

            const payload: any = { image_base64: base64, action }


            const res = await fetch('/api/seller/products/enhance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || 'Gagal enhance foto')
                return
            }
            setEnhancedPhoto(data.result)
            toast.success(action === 'remove_bg' ? 'Background berhasil dihapus!' : 'Foto berhasil di-enhance!')
        } catch { toast.error('Terjadi kesalahan') }
        finally { setLoading(null) }
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
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                        </div>
                    ) : (
                        <div className="space-y-3">
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

                            <div className="space-y-3">
                                <div className="space-y-4 rounded-lg border border-purple-100 bg-purple-50/30 p-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-purple-800">Ubah Background dengan AI:</label>
                                        <textarea
                                            className="w-full rounded-md border border-purple-200 text-sm py-2 px-3 focus:border-purple-400 focus:ring-purple-400 transition-colors bg-white min-h-[80px]"
                                            value={userInstruction}
                                            onChange={(e) => setUserInstruction(e.target.value)}
                                            placeholder="Contoh: Ubah warna latarnya jadi merah tua, beri efek pantulan cahaya studio..."
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 transition-all text-white font-medium shadow-md hover:shadow-lg"
                                        onClick={() => enhancePhoto('inpaint')} disabled={loading !== null || userInstruction.trim() === ''}>
                                        {loading === 'enhance_inpaint' ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Wand2 className="h-4 w-4 text-white" />}
                                        <span className="font-bold">Generate AI Image 🚀</span>
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        setEnhancedPhoto(null)
                                        setUserInstruction('')
                                        toast.info('Foto asli dipertahankan')
                                    }}>
                                        <X className="mr-1 h-3 w-3" /> Pertahankan Foto Asli
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full flex items-center justify-center gap-2 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                                        onClick={() => enhancePhoto('remove_bg')} disabled={loading !== null}>
                                        {loading === 'enhance_remove_bg' ? <Loader2 className="h-4 w-4 animate-spin text-orange-500" /> : <Eraser className="h-4 w-4 text-orange-500" />}
                                        Hapus Background
                                    </Button>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-3">
                                {enhancedPhoto && (
                                    <Button type="button" size="sm" className="flex-1" onClick={() => {
                                        onImageGenerated(enhancedPhoto); setUploadedPhoto(null); setEnhancedPhoto(null); toast.success('Foto ditambahkan!')
                                    }}>
                                        <Check className="mr-1 h-3 w-3" /> Gunakan Hasil
                                    </Button>
                                )}
                                <Button type="button" variant="outline" size="sm" onClick={() => { setUploadedPhoto(null); setEnhancedPhoto(null); setUserInstruction('') }}>
                                    <X className="mr-1 h-3 w-3" /> Reset
                                </Button>
                            </div>
                        </div>
                    )}
                </div>



                <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-4">
                    <p className="mb-2 text-xs font-semibold text-purple-800">🌟 Foto Studio Profesional Secara Gratis!</p>
                    <p className="text-[10px] text-purple-600 leading-relaxed">
                        Fitur <b>Magic Enhance✨</b> di atas menggunakan perpaduan Vision AI dan Image Generation. Sistem akan membaca bentuk barang jualan Anda, lalu secara otomatis membuatkan Latar Belakang Studio yang mewah dan sangat realistis tanpa biaya sama sekali.
                    </p>
                </div>

                <div className="border-t" />

                {/* ===== GENERATE SECTION ===== */}
                <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">✍️ Generate Konten</p>
                    <div className="grid grid-cols-3 gap-2">
                        <Button type="button" variant="outline" size="sm" className="h-auto flex-col gap-1.5 py-3 text-xs hover:bg-blue-50 hover:border-blue-200" onClick={() => generate('image')} disabled={loading !== null}>
                            {loading === 'image' ? <Loader2 className="h-5 w-5 animate-spin text-blue-500" /> : <ImageIcon className="h-5 w-5 text-blue-500" />}
                            Generate Foto
                        </Button>
                        <Button type="button" variant="outline" size="sm" className="h-auto flex-col gap-1.5 py-3 text-xs hover:bg-purple-50 hover:border-purple-200" onClick={() => generate('description')} disabled={loading !== null}>
                            {loading === 'description' ? <Loader2 className="h-5 w-5 animate-spin text-purple-500" /> : <FileText className="h-5 w-5 text-purple-500" />}
                            Generate Deskripsi
                        </Button>
                        <Button type="button" variant="outline" size="sm" className="h-auto flex-col gap-1.5 py-3 text-xs hover:bg-green-50 hover:border-green-200" onClick={() => generate('category')} disabled={loading !== null}>
                            {loading === 'category' ? <Loader2 className="h-5 w-5 animate-spin text-green-500" /> : <Tags className="h-5 w-5 text-green-500" />}
                            Saran Kategori
                        </Button>
                    </div>
                </div>

                {generatedImage && (
                    <div className="space-y-2 rounded-lg border bg-white p-3">
                        <p className="text-xs font-medium text-gray-500">📸 Foto AI Generated</p>
                        <img src={generatedImage} alt="AI Generated" className="w-full rounded-lg object-contain" style={{ maxHeight: 300 }} />
                        <div className="flex gap-2">
                            <Button type="button" size="sm" className="flex-1" onClick={() => { onImageGenerated(generatedImage); setGeneratedImage(null); toast.success('Foto ditambahkan!') }}>
                                <Check className="mr-1 h-3 w-3" /> Gunakan
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => setGeneratedImage(null)}><X className="h-3 w-3" /></Button>
                        </div>
                    </div>
                )}

                {generatedDesc && (
                    <div className="space-y-2 rounded-lg border bg-white p-3">
                        <p className="text-xs font-medium text-gray-500">📝 Deskripsi AI Generated</p>
                        <p className="whitespace-pre-wrap text-sm text-gray-700">{generatedDesc}</p>
                        <div className="flex gap-2">
                            <Button type="button" size="sm" className="flex-1" onClick={() => { onDescriptionGenerated(generatedDesc); setGeneratedDesc(null); toast.success('Deskripsi diterapkan!') }}>
                                <Check className="mr-1 h-3 w-3" /> Gunakan
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => setGeneratedDesc(null)}><X className="h-3 w-3" /></Button>
                        </div>
                    </div>
                )}

                {suggestedCategories.length > 0 && (
                    <div className="space-y-2 rounded-lg border bg-white p-3">
                        <p className="text-xs font-medium text-gray-500">🏷️ Saran Kategori</p>
                        <div className="flex flex-wrap gap-2">
                            {suggestedCategories.map((cat) => (
                                <button key={cat} type="button" className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 transition-colors hover:bg-green-100"
                                    onClick={() => { onCategorySelected(cat); setSuggestedCategories([]); toast.success(`Kategori "${cat}" dipilih`) }}>
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
        </Card >
    )
}
