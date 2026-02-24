'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Upload, Wand2, X, FileSearch, Copy, Check, Loader2, ImageIcon, FileText, Tags, Eraser } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

    // Gemini Prompt Generator States
    const [theme, setTheme] = useState('Minimalis')
    const [backgroundType, setBackgroundType] = useState('Warna Solid Terang')
    const [lighting, setLighting] = useState('Cahaya Natural Lembut')
    const [additionalInstruction, setAdditionalInstruction] = useState('')

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

            if (type === 'description') { onDescriptionGenerated(data.result); toast.success('Deskripsi berhasil di-generate!'); }
            else if (type === 'image') { onImageGenerated(data.result); toast.success('Foto berhasil di-generate!'); }
            else if (type === 'category') {
                try {
                    const match = data.result.match(/\[[\s\S]*\]/)
                    if (match) {
                        const suggestedCategories = JSON.parse(match[0]);
                        if (suggestedCategories.length > 0) {
                            onCategorySelected(suggestedCategories[0]); // Automatically select the first one
                            toast.success(`Kategori "${suggestedCategories[0]}" disarankan & dipilih!`);
                        } else {
                            toast.info('Tidak ada kategori yang disarankan.');
                        }
                    }
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

    function generateAndCopyPrompt() {
        if (!uploadedPhoto) return;

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
                        <div className="space-y-4">
                            <div className="relative overflow-hidden rounded-lg border bg-white">
                                <img
                                    src={uploadedPhoto}
                                    alt="Original"
                                    className="w-full object-contain"
                                    style={{ maxHeight: 250 }}
                                />
                                <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                                    📷 FOTO ASLI
                                </span>
                            </div>

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

                            <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => { setUploadedPhoto(null); }}>
                                <X className="mr-1 h-3 w-3" /> Batal & Hapus Foto
                            </Button>
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
