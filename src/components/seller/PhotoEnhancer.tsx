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
      // Step 1: Remove Background to isolate the object
      toast.info('Mensolasi produk (1/3)...')
      const bgRes = await fetch(`/api/seller/products/${productId}/enhance-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl, action: 'remove_bg' }),
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
          data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 255
        } else { // Transparent: This is the background -> WHITE
          data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 255
        }
      }
      ctx.putImageData(imgData, 0, 0)
      const maskBase64 = canvas.toDataURL('image/png')

      // Step 3: Call Inpainting API
      toast.info('Me-render latar AI (3/3)...')
      const inpaintRes = await fetch(`/api/seller/products/${productId}/enhance-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl, maskBase64, action: 'inpaint', customInstruction: userInstruction }),
      })
      const inpaintData = await inpaintRes.json()
      if (!inpaintRes.ok) throw new Error(inpaintData.error || 'Gagal membuat AI background')

      // Final Step: Overlay the transparent product on top of the new AI background
      const finalBgImg = new Image()
      finalBgImg.src = inpaintData.image_url
      await new Promise(res => { finalBgImg.onload = res })

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(finalBgImg, 0, 0, canvas.width, canvas.height) // AI Background
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height) // 100% Original Transparent Product

      const perfectResult = canvas.toDataURL('image/png')
      setEnhancedUrl(perfectResult)
      toast.success('Foto 100% Asli dengan Latar AI berhasil dibuat!')
    } catch (e: any) {
      toast.error(e.message || 'Terjadi kesalahan')
    } finally {
      setLoading(null)
    }
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
              <label className="text-sm font-semibold text-purple-800">Ubah Background Mode Inpainting (Generative Fill):</label>
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
