'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Check, X, Loader2, ArrowLeftRight, Copy } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface PhotoEnhancerProps {
  productId: string
  imageUrl: string
  onAccept: (enhancedUrl: string) => void
}

export function PhotoEnhancer({ productId, imageUrl, onAccept }: PhotoEnhancerProps) {
  const [loading, setLoading] = useState<string | null>(null)

  // Gemini Prompt Generator States
  const [theme, setTheme] = useState('Minimalis')
  const [backgroundType, setBackgroundType] = useState('Warna Solid Terang')
  const [lighting, setLighting] = useState('Cahaya Natural Lembut')
  const [additionalInstruction, setAdditionalInstruction] = useState('')



  function generateAndCopyPrompt() {
    if (!imageUrl) return;

    const generatedPrompt = `Tolong edit foto produk saya ini agar terlihat seperti foto studio profesional. 
Ganti latar belakangnya menjadi tipe [${backgroundType}] dengan nuansa/vibes [${theme}].
Gunakan teknik pencahayaan [${lighting}] agar produk terlihat sangat jernih dan menarik perhatian.
Harap JANGAN mengubah atau mendistorsi bentuk, teks, atau logo asli dari produk saya.
${additionalInstruction ? `\nInstruksi Tambahan: ${additionalInstruction}` : ''}
`;

    // Copy to clipboard
    navigator.clipboard.writeText(generatedPrompt).then(() => {
      toast.success('Prompt berhasil disalin ke clipboard!');

      // Open Gemini
      setTimeout(() => {
        window.open('https://gemini.google.com/', '_blank');
      }, 1000);
    }).catch(() => {
      toast.error('Gagal menyalin prompt. Silakan salin manual.');
    });
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
        ) : ( // This 'else' branch now correctly handles the case when not loading
          // The original code had '!enhancedUrl ? (' here, but it was missing the 'else' for when enhancedUrl is true.
          // Assuming the prompt generation UI is the default when not loading and no enhancedUrl is present.
          <div className="space-y-4 rounded-lg border border-purple-100 bg-purple-50/30 p-4">
            <p className="text-[13px] font-semibold text-purple-800 mb-1">Ciptakan Latar AI Berkualitas Tinggi</p>
            <p className="text-[11px] text-purple-600 mb-4">Pilih gaya yang Anda inginkan, kami akan merakitkan instruksi cerdas untuk Anda proses di Google Gemini secara gratis.</p>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-purple-900">1. Tema / Nuansa</label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-full bg-white text-xs h-9 border-purple-200">
                    <SelectValue placeholder="Pilih tema..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Minimalis">Minimalis (Bersih & Rapi)</SelectItem>
                    <SelectItem value="Elegan">Elegan (Mewah & Klasik)</SelectItem>
                    <SelectItem value="Alam">Alam (Segar & Organik)</SelectItem>
                    <SelectItem value="Futuristik/Cyberpunk">Futuristik / Neon</SelectItem>
                    <SelectItem value="Warm/Cozy">Hangat / Cozy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-purple-900">2. Latar Belakang</label>
                <Select value={backgroundType} onValueChange={setBackgroundType}>
                  <SelectTrigger className="w-full bg-white text-xs h-9 border-purple-200">
                    <SelectValue placeholder="Pilih latar belakang..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Warna Solid Terang">Warna Solid Terang</SelectItem>
                    <SelectItem value="Kayu Klasik/Meja Kayu">Meja Kayu Klasik</SelectItem>
                    <SelectItem value="Marmer Mewah">Lantai Marmer Mewah</SelectItem>
                    <SelectItem value="Pemandangan Alam">Pemandangan Alam</SelectItem>
                    <SelectItem value="Studio Kosong">Studio Foto Hitam/Putih</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-purple-900">3. Setting Cahaya</label>
                <Select value={lighting} onValueChange={setLighting}>
                  <SelectTrigger className="w-full bg-white text-xs h-9 border-purple-200">
                    <SelectValue placeholder="Pilih pencahayaan..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cahaya Natural Lembut">Natural Jendela</SelectItem>
                    <SelectItem value="Lampu Sorot Dramatis">Sorot Dramatis / Spotlight</SelectItem>
                    <SelectItem value="Cahaya Softbox Konstan">Cahaya Studio Softbox</SelectItem>
                    <SelectItem value="Sinematik">Sinematik Moody</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-purple-900">4. Permintaan Khusus (Opsional)</label>
                <Textarea
                  className="w-full text-xs min-h-[60px] bg-white border-purple-200 resize-none py-2"
                  placeholder="Contoh: Tambahkan pantulan cahaya di bawah produk, atau dedaunan pisang di pojok..."
                  value={additionalInstruction}
                  onChange={(e) => setAdditionalInstruction(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="button"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all text-white font-medium shadow-md hover:shadow-lg h-10"
                onClick={generateAndCopyPrompt}
              >
                <Copy className="h-4 w-4 text-white" />
                <span className="font-bold text-sm">Copy Prompt & Buka Gemini 🚀</span>
              </Button>
              <p className="text-[10px] text-center text-purple-600 mt-2">
                Setelah terbuka, paste prompt ini + upload gambar asli.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
