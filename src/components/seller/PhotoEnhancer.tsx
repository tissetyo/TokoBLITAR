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
  const [visionModel, setVisionModel] = useState<'@cf/meta/llama-3.2-11b-vision-instruct' | '@cf/llava-hf/llava-1.5-7b-hf' | '@cf/unum/uform-gen2-qwen-500m'>('@cf/meta/llama-3.2-11b-vision-instruct')
  const [loading, setLoading] = useState<string | null>(null)
  const [showOriginal, setShowOriginal] = useState(false)
  const [analyzedPrompt, setAnalyzedPrompt] = useState<string | null>(null)
  const [userInstruction, setUserInstruction] = useState('')

  async function handleAnalyze() {
    setLoading('analyze')
    try {
      const res = await fetch(`/api/seller/products/${productId}/enhance-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl, visionModel, action: 'analyze_image' }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Gagal analisis foto'); return }
      if (data.result) { setAnalyzedPrompt(data.result); toast.success('Analisis selesai! Silakan periksa prompt AI.') }
    } catch { toast.error('Terjadi kesalahan') } finally { setLoading(null) }
  }

  async function handleGenerate() {
    setLoading('generate')
    try {
      const res = await fetch(`/api/seller/products/${productId}/enhance-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl, action: 'generate_from_prompt', promptText: analyzedPrompt, customInstruction: userInstruction }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Gagal generate foto'); return }
      if (data.image_url) { setEnhancedUrl(data.image_url); toast.success('Foto berhasil di-generate!') }
    } catch { toast.error('Terjadi kesalahan') } finally { setLoading(null) }
  }

  if (!enhancedUrl && !loading && !analyzedPrompt) {
    return (
      <Button variant="outline" size="sm" onClick={handleAnalyze}>
        <Sparkles className="mr-1 h-4 w-4 text-purple-600" />
        Analisis Foto (AI Vision)
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
        {loading === 'analyze' || loading === 'generate' ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            <p className="text-sm text-gray-500">{loading === 'analyze' ? 'Menganalisis gambar dengan AI Vision...' : 'Membuat foto produk dengan AI...'}</p>
            <p className="text-xs text-gray-400">Biasanya 5-15 detik</p>
          </div>
        ) : !enhancedUrl && analyzedPrompt ? (
          <div className="space-y-4 rounded-lg border border-purple-100 bg-purple-50/30 p-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-purple-800">1. Hasil Pandangan AI (Edit jika salah):</label>
              <textarea
                className="w-full rounded-md border border-purple-200 text-sm py-2 px-3 focus:border-purple-400 focus:ring-purple-400 transition-colors min-h-[100px]"
                value={analyzedPrompt}
                onChange={(e) => setAnalyzedPrompt(e.target.value)}
                placeholder="Deskripsi fisik produk dari AI..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-purple-800">2. Instruksi Tambahan (Opsional):</label>
              <textarea
                className="w-full rounded-md border border-purple-200 text-sm py-2 px-3 focus:border-purple-400 focus:ring-purple-400 transition-colors bg-white min-h-[80px]"
                value={userInstruction}
                onChange={(e) => setUserInstruction(e.target.value)}
                placeholder="Contoh: Ubah warna botol jadi merah tua, tambahkan efek cahaya studio..."
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => { setAnalyzedPrompt(null); setUserInstruction('') }}>
                Batal
              </Button>
              <Button
                type="button"
                className="flex-[2] flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 transition-all text-white font-medium"
                onClick={handleGenerate} disabled={loading !== null}>
                <Sparkles className="h-4 w-4 text-white" />
                <span>Generate Final Image 🚀</span>
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
                <select
                  className="w-full max-w-[150px] rounded-md border border-gray-200 text-xs py-1.5 px-2 bg-gray-50/50 shadow-sm focus:border-purple-400 focus:ring-purple-400 transition-colors"
                  value={visionModel}
                  onChange={(e) => setVisionModel(e.target.value as any)}
                  disabled={loading !== null}
                >
                  <option value="@cf/meta/llama-3.2-11b-vision-instruct">Llama 3.2 Vision (Akurat)</option>
                  <option value="@cf/llava-hf/llava-1.5-7b-hf">Llava 1.5 (Aman / Tanpa Agreement)</option>
                  <option value="@cf/unum/uform-gen2-qwen-500m">UForm Qwen 500m (Super Cepat)</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEnhancedUrl(null)
                    setAnalyzedPrompt(null)
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
