'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { AreaSearch } from '@/components/ui/area-search'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ProfileForm({ profile, email }: { profile: any; email: string }) {
    const router = useRouter()
    const [saving, setSaving] = useState(false)

    // Initialize selected area if exists
    const initialArea = profile?.area_id && profile?.city
        ? { id: profile.area_id, name: `${profile.city}${profile.province ? `, ${profile.province}` : ''}` }
        : null

    const [selectedArea, setSelectedArea] = useState<{ id: string; name: string } | null>(initialArea)

    const [formData, setFormData] = useState({
        full_name: profile?.full_name || '',
        phone: profile?.phone || '',
        street: profile?.street || '',
        city: profile?.city || '',
        province: profile?.province || '',
        postal_code: profile?.postal_code || '',
        area_id: profile?.area_id || '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const res = await fetch('/api/buyer/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Gagal menyimpan profil')

            toast.success('Profil berhasil diperbarui')
            router.refresh()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
        } finally {
            setSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="full_name">Nama Lengkap</Label>
                    <Input id="full_name" value={formData.full_name} onChange={handleChange} placeholder="Nama Lengkap" />
                </div>
                <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={email} disabled className="bg-gray-50 text-gray-500" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="phone">Nomor Telepon (WhatsApp)</Label>
                    <Input id="phone" value={formData.phone} onChange={handleChange} placeholder="Contoh: 08123456789" />
                </div>
            </div>

            <div className="space-y-4 rounded-lg border p-4 bg-gray-50/50">
                <h4 className="font-medium">Alamat Pengiriman Utama</h4>

                <div className="space-y-2">
                    <Label htmlFor="street">Alamat Lengkap</Label>
                    <Textarea
                        id="street"
                        value={formData.street}
                        onChange={handleChange}
                        placeholder="Jalan, RT/RW, Kecamatan, dsb."
                        rows={2}
                    />
                </div>

                <div className="space-y-2">
                    <AreaSearch
                        label="Kecamatan / Kota Tujuan"
                        placeholder="Ketik nama kecamatan..."
                        defaultValue={selectedArea}
                        onSelect={(area) => {
                            if (area) {
                                setSelectedArea(area)
                                const parts = area.name.split(',').map(s => s.trim())
                                const city = parts.length > 1 ? parts[1] : area.name
                                const province = parts.length > 2 ? parts[2] : ''

                                setFormData(prev => ({
                                    ...prev,
                                    area_id: area.id,
                                    city,
                                    province,
                                }))
                            } else {
                                setSelectedArea(null)
                                setFormData(prev => ({ ...prev, area_id: '', city: '', province: '' }))
                            }
                        }}
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor="city">Kota/Kabupaten</Label>
                        <Input id="city" value={formData.city} readOnly className="bg-gray-100" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="province">Provinsi</Label>
                        <Input id="province" value={formData.province} readOnly className="bg-gray-100" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="postal_code">Kode Pos</Label>
                        <Input id="postal_code" value={formData.postal_code} onChange={handleChange} placeholder="Kodepos" />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Simpan Profil
                </Button>
            </div>
        </form>
    )
}
