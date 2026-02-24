'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Palette, Link as LinkIcon, Plus, Trash2, Globe, LayoutTemplate, LayoutPanelTop, MonitorSmartphone, Type } from 'lucide-react'
import { STORE_THEMES, STORE_FONTS } from '@/lib/themes'

interface StoreLink {
    id: string
    title: string
    url: string
    position: number
}

interface StoreAppearanceFormProps {
    store: {
        id: string
        name: string
        slug: string
        web_enabled: boolean
        bio_enabled: boolean
        theme: string
        font_family: string
        bio_description: string | null
    }
    initialLinks: StoreLink[]
}

export function StoreAppearanceForm({ store, initialLinks }: StoreAppearanceFormProps) {
    const supabase = createSupabaseBrowserClient()
    const [loading, setLoading] = useState(false)

    // Store settings
    const [webEnabled, setWebEnabled] = useState(store.web_enabled)
    const [bioEnabled, setBioEnabled] = useState(store.bio_enabled)
    const [theme, setTheme] = useState(store.theme || 'minimal_light')
    const [fontFamily, setFontFamily] = useState(store.font_family || 'font-sans')
    const [bioDesc, setBioDesc] = useState(store.bio_description || '')

    // Links state
    const [links, setLinks] = useState<StoreLink[]>(initialLinks)

    async function handleSaveSettings() {
        setLoading(true)
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error: storeError } = await (supabase as any)
                .from('stores')
                .update({
                    web_enabled: webEnabled,
                    bio_enabled: bioEnabled,
                    theme: theme,
                    font_family: fontFamily,
                    bio_description: bioDesc
                })
                .eq('id', store.id)

            if (storeError) throw storeError

            toast.success('Pengaturan tampilan berhasil disimpan!')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            toast.error(error.message || 'Gagal menyimpan pengaturan')
        } finally {
            setLoading(false)
        }
    }

    async function handleAddLink() {
        const newPos = links.length > 0 ? Math.max(...links.map(l => l.position)) + 1 : 0
        const newLink = {
            store_id: store.id,
            title: 'Link Baru',
            url: 'https://',
            position: newPos,
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
            .from('store_links')
            .insert(newLink)
            .select()
            .single()

        if (error) { toast.error('Gagal menambah link'); return }
        setLinks([...links, data])
    }

    async function handleUpdateLink(id: string, field: 'title' | 'url', value: string) {
        setLinks(links.map(l => l.id === id ? { ...l, [field]: value } : l))
    }

    async function handleSaveLink(id: string) {
        const link = links.find(l => l.id === id)
        if (!link) return

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
            .from('store_links')
            .update({ title: link.title, url: link.url })
            .eq('id', id)

        if (error) toast.error('Gagal menyimpan link')
        else toast.success('Link tersimpan')
    }

    async function handleDeleteLink(id: string) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any).from('store_links').delete().eq('id', id)
        if (error) toast.error('Gagal menghapus link')
        else setLinks(links.filter(l => l.id !== id))
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6 flex flex-col items-center">

            <div className="grid gap-6 md:grid-cols-2 w-full">
                {/* Global Settings */}
                <Card className="border-slate-200 shadow-sm w-full">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                            <Palette className="h-5 w-5 text-blue-600" />
                            <CardTitle className="text-lg">Tema Global & Tampilan</CardTitle>
                        </div>
                        <CardDescription>Pilih preset visual dan atur status akses toko Anda.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {/* Theme Preset Selection */}
                        <div className="space-y-3">
                            <Label className="font-semibold text-slate-700">Preset Desain (20 Pilihan)</Label>
                            <Select value={theme} onValueChange={setTheme}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih Model Tampilan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {STORE_THEMES.map((t) => (
                                        <SelectItem key={t.id} value={t.id}>
                                            <div className="flex items-center gap-2">
                                                <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: t.primaryColor }} />
                                                <span>{t.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Font Style Selection */}
                        <div className="space-y-3">
                            <Label className="font-semibold text-slate-700 flex items-center gap-2">
                                <Type className="h-4 w-4" />
                                Gaya Font Publik
                            </Label>
                            <Select value={fontFamily} onValueChange={setFontFamily}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih Tipe Font" />
                                </SelectTrigger>
                                <SelectContent>
                                    {STORE_FONTS.map((f) => (
                                        <SelectItem key={f.id} value={f.id}>
                                            <span className={f.fontClass}>{f.name}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="border-t border-slate-100" />

                        {/* Store Mode Toggles */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-semibold flex items-center gap-2">
                                        <MonitorSmartphone className="h-4 w-4 text-slate-500" />
                                        Web Toko Reguler
                                    </Label>
                                    <p className="text-[11px] text-slate-500">Etalase (namatoko.tokoblitar.com)</p>
                                </div>
                                <Switch checked={webEnabled} onCheckedChange={setWebEnabled} />
                            </div>

                            <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-semibold flex items-center gap-2">
                                        <LayoutPanelTop className="h-4 w-4 text-slate-500" />
                                        Link-in-Bio Page
                                    </Label>
                                    <p className="text-[11px] text-slate-500">Minimalis (blitar.click/namatoko)</p>
                                </div>
                                <Switch checked={bioEnabled} onCheckedChange={setBioEnabled} />
                            </div>
                        </div>

                        <Button onClick={handleSaveSettings} disabled={loading} className="w-full">
                            Simpan Pengaturan Visual
                        </Button>
                    </CardContent>
                </Card>

                {/* Link-in-Bio Content editor */}
                <Card className="border-slate-200 shadow-sm relative overflow-hidden w-full">
                    {/* Overlay if bio mode is disabled */}
                    {!bioEnabled && (
                        <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-[1px] flex flex-col items-center justify-center p-6 text-center">
                            <LayoutPanelTop className="h-10 w-10 text-slate-300 mb-3" />
                            <p className="font-semibold text-slate-700">Link-in-Bio Nonaktif</p>
                            <p className="text-xs text-slate-500 mt-1">Aktifkan "Link-in-Bio Page" di panel kiri untuk mengedit profil dan link eksternal toko Anda.</p>
                        </div>
                    )}

                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                            <LayoutTemplate className="h-5 w-5 text-purple-600" />
                            <CardTitle className="text-lg">Konten Link-in-Bio</CardTitle>
                        </div>
                        <CardDescription>Aturan khusus untuk halaman blitar.click.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        <div className="space-y-2">
                            <Label className="font-semibold text-slate-700">Bio / Deskripsi Toko</Label>
                            <Textarea
                                placeholder="Jelaskan mengenai tokomu dalam 1-2 kalimat..."
                                value={bioDesc}
                                onChange={(e) => setBioDesc(e.target.value)}
                                className="resize-none h-20 text-sm"
                            />
                            <Button onClick={handleSaveSettings} disabled={loading} variant="secondary" size="sm" className="w-full mt-2 border border-slate-200">
                                Simpan Bio
                            </Button>
                        </div>

                        <div className="border-t border-slate-100 pt-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="font-semibold text-slate-700">Daftar Tombol Tautan</Label>
                                <Button onClick={handleAddLink} size="sm" variant="outline" className="h-8 gap-1 text-xs">
                                    <Plus className="h-3 w-3" /> Tambah
                                </Button>
                            </div>

                            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                                {links.length === 0 ? (
                                    <div className="text-center py-6 bg-slate-50 border border-dashed rounded-lg">
                                        <p className="text-xs text-slate-400">Belum ada tautan ditambahkan.</p>
                                    </div>
                                ) : links.sort((a, b) => a.position - b.position).map((link) => (
                                    <div key={link.id} className="relative rounded-lg border border-slate-200 bg-white p-3 shadow-sm space-y-2 group">
                                        <button
                                            onClick={() => handleDeleteLink(link.id)}
                                            className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full hover:bg-red-200 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>

                                        <div className="space-y-2">
                                            <Input
                                                value={link.title}
                                                onChange={(e) => handleUpdateLink(link.id, 'title', e.target.value)}
                                                onBlur={() => handleSaveLink(link.id)}
                                                placeholder="Judul Tautan (Cth: Beli di Shopee)"
                                                className="h-8 text-sm font-medium"
                                            />
                                            <div className="flex items-center gap-2">
                                                <LinkIcon className="h-3 w-3 text-slate-400" />
                                                <Input
                                                    value={link.url}
                                                    onChange={(e) => handleUpdateLink(link.id, 'url', e.target.value)}
                                                    onBlur={() => handleSaveLink(link.id)}
                                                    placeholder="URL Tautan (https://...)"
                                                    className="h-8 text-xs text-slate-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </CardContent>
                </Card>
            </div>

            <div className="text-center bg-blue-50/50 rounded-lg border border-blue-100 p-6 space-y-2 w-full max-w-2xl mt-4">
                <Globe className="h-8 w-8 text-blue-400 mx-auto" />
                <h3 className="font-bold text-slate-800">Cek Penampilan Publik</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">Anda dapat melihat langsung hasil konfigurasi tema preset dan tautan di kedua format storefront.</p>
                <div className="flex justify-center gap-4 pt-3">
                    <a href={`/bio/${store.slug}`} target="_blank" className="text-sm font-semibold text-blue-600 hover:underline">Lihat Link-in-Bio ➔</a>
                    <a href={`/store/${store.slug}`} target="_blank" className="text-sm font-semibold text-blue-600 hover:underline">Lihat Web Toko ➔</a>
                </div>
            </div>

        </div>
    )
}
