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
  const [loading, setLoading] = useState(false)
  const [showOriginal, setShowOriginal] = useState(false)

  async function handleEnhance() {
    setLoading(true)
    try {
      const res = await fetch(`/api/seller/products/${productId}/enhance-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Gagal meningkatkan foto')
        setLoading(false)
        return
      }

      const { prediction_id } = await res.json()

      // Poll for result
      const result = await pollPrediction(prediction_id)
      if (result) {
        setEnhancedUrl(result)
        toast.success('Foto berhasil ditingkatkan!')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  async function pollPrediction(id: string): Promise<string | null> {
    const maxAttempts = 60
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 2000))

      const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
        headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN || ''}` },
      })
      const pred = await res.json()

      if (pred.status === 'succeeded') {
        const output = Array.isArray(pred.output) ? pred.output[0] : pred.output
        return output
      }
      if (pred.status === 'failed') {
        toast.error('AI enhancement gagal')
        return null
      }
    }
    toast.error('Timeout — coba lagi nanti')
    return null
  }

  if (!enhancedUrl && !loading) {
    return (
      <Button variant="outline" size="sm" onClick={handleEnhance}>
        <Sparkles className="mr-1 h-3 w-3" />
        AI Enhance
      </Button>
    )
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4" />
          AI Photo Enhancement
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="text-sm text-gray-500">Meningkatkan foto dengan AI...</p>
          </div>
        ) : enhancedUrl ? (
          <div className="space-y-4">
            {/* Before / After */}
            <div className="relative overflow-hidden rounded-lg border">
              <img
                src={showOriginal ? imageUrl : enhancedUrl}
                alt={showOriginal ? 'Original' : 'Enhanced'}
                className="w-full object-contain"
              />
              <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                {showOriginal ? 'SEBELUM' : 'SESUDAH'}
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
