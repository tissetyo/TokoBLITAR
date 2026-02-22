'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle2, Copy, ExternalLink, Sparkles, Loader2 } from 'lucide-react'
import Link from 'next/link'

const STEPS = [
    { title: 'Buka Tokopedia Seller Center', desc: 'Kunjungi halaman pendaftaran toko Tokopedia. Daftar dengan email, HP, atau akun Google.', link: { label: 'Daftar Toko Tokopedia', url: 'https://seller.tokopedia.com/new' }, generates: null },
    { title: 'Buat akun Tokopedia', desc: 'Jika belum punya akun, daftar dulu. Masukkan email dan nomor HP aktif. Verifikasi via OTP.', generates: null },
    { title: 'Isi informasi toko', desc: 'Masukkan nama toko, domain, dan lokasi toko di Blitar.', tip: 'Nama toko di Tokopedia tidak bisa diubah setelah dibuat!', generates: 'description' },
    { title: 'Pilih kategori produk', desc: 'Pilih kategori yang paling relevan dengan produk yang kamu jual.', generates: 'categories' },
    { title: 'Tambahkan produk pertama', desc: 'Upload produk pertama. Masukkan nama, deskripsi, harga, stok, dan foto.', tip: 'Kamu bisa copy-paste detail produk dari dashboard TokoBLITAR.', generates: null },
    { title: 'Atur pengiriman', desc: 'Aktifkan jasa pengiriman yang tersedia di Blitar (JNE, J&T, SiCepat, dll). Masukkan alamat pickup.', generates: null },
    { title: 'Atur rekening bank', desc: 'Tambahkan rekening bank untuk menerima pembayaran. Nama harus sesuai KTP.', generates: null },
    { title: '✅ Toko aktif di Tokopedia!', desc: 'Toko kamu sekarang live! Pembeli seluruh Indonesia bisa menemukan produk kamu.', generates: null },
]

export default function TokopediaPage() {
    const [activeStep, setActiveStep] = useState(0)
    const [completed, setCompleted] = useState<Set<number>>(new Set())
    const [content, setContent] = useState<Record<string, string>>({})
    const [generating, setGenerating] = useState<string | null>(null)

    const toggleStep = (i: number) => { setCompleted(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n }) }

    const generate = useCallback(async (type: string) => {
        setGenerating(type)
        try {
            const res = await fetch('/api/seller/marketplace/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, platform: 'tokopedia' }) })
            const data = await res.json()
            if (res.ok) { setContent(prev => ({ ...prev, [type]: data.content })); toast.success('Konten berhasil di-generate!') }
            else toast.error(data.error || 'Gagal generate')
        } catch { toast.error('Terjadi kesalahan') }
        setGenerating(null)
    }, [])

    const step = STEPS[activeStep]
    const LABELS: Record<string, string> = { description: 'Deskripsi Toko', categories: 'Kategori Produk' }

    return (
        <div className="flex h-[calc(100vh-64px)] flex-col">
            <div className="border-b bg-white px-6 py-4">
                <Link href="/dashboard/marketplace" className="mb-2 flex items-center gap-1 text-sm text-gray-500 hover:text-black"><ArrowLeft className="h-4 w-4" /> Kembali</Link>
                <div className="flex items-center gap-3"><span className="text-2xl">🟢</span><div><h1 className="text-xl font-bold">Tokopedia</h1><p className="text-sm text-gray-500">Jual produk kamu di marketplace terbesar Indonesia</p></div></div>
            </div>
            <div className="flex flex-1 overflow-hidden">
                <div className="w-1/2 overflow-y-auto border-r bg-white p-6">
                    <div className="mb-4 flex items-center justify-between"><p className="text-sm font-medium text-gray-500">Langkah-langkah</p><span className="text-xs text-gray-400">{completed.size}/{STEPS.length}</span></div>
                    <div className="mb-6 h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${(completed.size / STEPS.length) * 100}%` }} /></div>
                    <div className="space-y-1">{STEPS.map((s, i) => (
                        <button key={i} onClick={() => setActiveStep(i)} className={`flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left transition-all ${activeStep === i ? 'bg-green-50 ring-1 ring-green-200' : 'hover:bg-gray-50'}`}>
                            {completed.has(i) ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" onClick={e => { e.stopPropagation(); toggleStep(i) }} /> : <div onClick={e => { e.stopPropagation(); toggleStep(i) }} className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold ${activeStep === i ? 'border-green-400 text-green-600' : 'border-gray-200 text-gray-400'}`}>{i + 1}</div>}
                            <div className="min-w-0"><p className={`text-sm font-medium ${completed.has(i) ? 'text-green-700 line-through' : 'text-gray-800'}`}>{s.title}</p><p className="text-xs text-gray-400 line-clamp-1">{s.desc}</p></div>
                            {s.generates && <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-purple-400" />}
                        </button>
                    ))}</div>
                </div>
                <div className="w-1/2 overflow-y-auto bg-gray-50 p-6">
                    <div className="mx-auto max-w-lg">
                        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
                            <div className="mb-1 flex items-center gap-2"><div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-600">{activeStep + 1}</div><h2 className="font-semibold">{step.title}</h2></div>
                            <p className="mt-2 text-sm text-gray-600">{step.desc}</p>
                            {step.tip && <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-800">💡 <strong>Tip:</strong> {step.tip}</div>}
                            {step.link && <a href={step.link.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#42b549] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90">{step.link.label} <ExternalLink className="h-3.5 w-3.5" /></a>}
                            <div className="mt-4 flex gap-2">
                                {activeStep > 0 && <Button variant="outline" size="sm" onClick={() => setActiveStep(activeStep - 1)}>← Sebelumnya</Button>}
                                <Button size="sm" onClick={() => { toggleStep(activeStep); if (activeStep < STEPS.length - 1) setActiveStep(activeStep + 1) }}>{completed.has(activeStep) ? 'Batal selesai' : 'Tandai selesai →'}</Button>
                            </div>
                        </div>
                        {step.generates ? (
                            <div className="rounded-2xl bg-white p-6 shadow-sm">
                                <div className="mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-purple-500" /><h3 className="font-semibold">AI Generate</h3></div>
                                <p className="mb-4 text-xs text-gray-500">Generate otomatis dari profil toko kamu. Copy hasilnya ke Tokopedia Seller Center.</p>
                                <Button onClick={() => generate(step.generates!)} disabled={generating !== null} className="mb-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white">{generating === step.generates ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="mr-2 h-4 w-4" /> Generate {LABELS[step.generates] || step.generates}</>}</Button>
                                {content[step.generates] && <div className="relative"><Textarea value={content[step.generates]} onChange={e => setContent(prev => ({ ...prev, [step.generates!]: e.target.value }))} rows={6} className="pr-10 text-sm" /><button onClick={() => { navigator.clipboard.writeText(content[step.generates!]); toast.success('Disalin!') }} className="absolute right-2 top-2 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><Copy className="h-4 w-4" /></button><p className="mt-2 text-[10px] text-gray-400">Edit lalu copy ke Tokopedia</p></div>}
                            </div>
                        ) : (
                            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white/50 p-8 text-center"><p className="text-sm text-gray-400">Langkah ini tidak membutuhkan AI generation.<br />Ikuti instruksi, lalu tandai selesai.</p></div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
