'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Check, X, Loader2, ArrowLeftRight } from 'lucide-react'
import { toast } from 'sonner'

interface PhotoEnhancerProps {
  productId: string
  imageUrl: string
  onAccept: (enhancedUrl: string) => void
}

export function PhotoEnhancer({ productId, imageUrl, onAccept }: PhotoEnhancerProps) {
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [showOriginal, setShowOriginal] = useState(false)
  const [userInstruction, setUserInstruction] = useState('')



  async function handleGenerate() {
    setLoading('generate')
    try {
      // Step 1: Detect Object Bounding Box using Cloudflare detr-resnet-50
      toast.info('Mendeteksi posisi produk (1/3)...')
      const detectRes = await fetch(`/api/seller/products/${productId}/enhance-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl, action: 'detect_object' }),
      })
      const detectData = await detectRes.json()
      if (!detectRes.ok) throw new Error(detectData.error || 'Gagal mendeteksi objek')

      if (!detectData.result || detectData.result.length === 0) {
        throw new Error('Tidak ada objek produk yang terdeteksi di gambar ini.')
      }

      // Cari bounding box dengan score tertinggi
      const bestMatch = detectData.result.reduce((prev: any, current: any) => (prev.score > current.score) ? prev : current)
      const { xmin, ymin, xmax, ymax } = bestMatch.box

      // Step 2: Create Inpainting Mask
      toast.info('Membuat cetakan area AI (2/3)...')
      const img = new Image()
      img.crossOrigin = "anonymous"
      if (imageUrl.startsWith('data:')) {
        img.src = imageUrl
      } else {
        // If we have a URL, fetch it as blob to avoid canvas cross-origin taint
        const blobRes = await fetch(imageUrl)
        const blob = await blobRes.blob()
        img.src = URL.createObjectURL(blob)
      }
      await new Promise(res => { img.onload = res })

      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!

      // Fill with WHITE (Area for AI to Generate / Replace)
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Fill Object Bounding Box with BLACK (Area to Preserve)
      ctx.fillStyle = 'black'
      ctx.fillRect(xmin, ymin, xmax - xmin, ymax - ymin)

      const maskBase64 = canvas.toDataURL('image/png')

      // Step 3: Send to Cloudflare Inpainting Model
      toast.info('Me-render latar AI (3/3)...')
      // Note: we must pass imageBase64 instead of image_url since we need to ensure the backend gets the raw bits smoothly, or the backend fetch image_url works too.
      // Backend already supports image_url fetching.
      const inpaintRes = await fetch(`/api/seller/products/${productId}/enhance-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl, maskBase64, action: 'inpaint', customInstruction: userInstruction }),
      })
      const inpaintData = await inpaintRes.json()
      if (!inpaintRes.ok) throw new Error(inpaintData.error || 'Gagal membuat AI background')

      // Final Step: Overlay the original object strictly inside the bounding box onto the AI generated image.
      // This guarantees the product pixels are 100% untouched by AI compression.
      const finalBgImg = new Image()
      finalBgImg.src = inpaintData.image_url
      await new Promise(res => { finalBgImg.onload = res })

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(finalBgImg, 0, 0, canvas.width, canvas.height) // Draw AI Background

      // Draw ONLY the original bounding box region from the original image
      ctx.drawImage(img, xmin, ymin, xmax - xmin, ymax - ymin, xmin, ymin, xmax - xmin, ymax - ymin)

      const perfectResult = canvas.toDataURL('image/png')
      setEnhancedUrl(perfectResult)
      toast.success('Latar belakang berhasil diubah!')
    } catch { toast.error('Terjadi kesalahan') } finally { setLoading(null) }
  }



  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4" />
          AI Photo Generation
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading === 'generate' ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            <p className="text-sm text-gray-500">Memodel Ulang Bentuk dan Latar (AI Generating)...</p>
            <p className="text-xs text-gray-400">Biasanya 8-20 detik</p>
          </div>
        ) : !enhancedUrl ? (
          <div className="space-y-4 rounded-lg border border-purple-100 bg-purple-50/30 p-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-purple-800">Ubah Background Mode Multi-Model AI (Deteksi Objek + Inpainting):</label>
              <textarea
                className="w-full rounded-md border border-purple-200 text-sm py-2 px-3 focus:border-purple-400 focus:ring-purple-400 transition-colors bg-white min-h-[80px]"
                value={userInstruction}
                onChange={(e) => setUserInstruction(e.target.value)}
                placeholder="Contoh: Ubah warna latarnya jadi merah tua, beri efek pantulan cahaya studio..."
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 transition-all text-white font-medium"
                onClick={handleGenerate} disabled={loading !== null || userInstruction.trim() === ''}>
                <Sparkles className="h-4 w-4 text-white" />
                <span>Generate AI Image 🚀</span>
              </Button>
            </div>
          </div>
        ) : enhancedUrl ? (
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-lg border">
              <img
                src={showOriginal ? imageUrl : enhancedUrl}
                alt={showOriginal ? 'Original' : 'AI Generated'}
                className="w-full object-contain"
              />
              <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                {showOriginal ? 'ASLI' : 'AI GENERATED'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOriginal(!showOriginal)}
              >
                <ArrowLeftRight className="mr-1 h-3 w-3" />
                {showOriginal ? 'Lihat Hasil' : 'Lihat Asli'}
              </Button>

              <div className="flex gap-2">

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEnhancedUrl(null)
                    setUserInstruction('')
                    toast.info('Dibatalkan, kembali ke editor')
                  }}
                >
                  <X className="mr-1 h-3 w-3" />
                  Tolak
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    onAccept(enhancedUrl)
                    toast.success('Foto AI digunakan!')
                  }}
                >
                  <Check className="mr-1 h-3 w-3" />
                  Gunakan
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
