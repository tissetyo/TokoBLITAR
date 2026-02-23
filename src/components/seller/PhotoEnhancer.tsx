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
  const [visionModel, setVisionModel] = useState<'@cf/meta/llama-3.2-11b-vision-instruct' | '@cf/llava-hf/llava-1.5-7b-hf' | '@cf/google/gemma-3-27b-it'>('@cf/meta/llama-3.2-11b-vision-instruct')
  const [loading, setLoading] = useState(false)
  const [showOriginal, setShowOriginal] = useState(false)

  async function handleEnhance() {
    setLoading(true)
    try {
      const res = await fetch(`/api/seller/products/${productId}/enhance-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl, visionModel }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Gagal meningkatkan foto')
        return
      }

      if (data.image_url) {
        setEnhancedUrl(data.image_url)
        toast.success('Foto berhasil di-generate!')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  if (!enhancedUrl && !loading) {
    return (
      <Button variant="outline" size="sm" onClick={handleEnhance}>
        <Sparkles className="mr-1 h-3 w-3" />
        AI Generate Foto
      </Button>
    )
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
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="text-sm text-gray-500">Membuat foto produk dengan AI...</p>
            <p className="text-xs text-gray-400">Biasanya 5-15 detik</p>
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
                    toast.info('Foto asli dipertahankan')
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
