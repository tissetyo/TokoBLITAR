'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Store, MapPin, Truck, Save, Loader2 } from 'lucide-react'
import { AreaSearch } from '@/components/ui/area-search'

interface Area {
  id: string
  name: string
}

const AVAILABLE_COURIERS = [
  { id: 'jne', name: 'JNE' },
  { id: 'jnt', name: 'J&T Express' },
  { id: 'sicepat', name: 'SiCepat' },
  { id: 'anteraja', name: 'AnterAja' },
  { id: 'pos', name: 'Pos Indonesia' },
  { id: 'tiki', name: 'TIKI' },
]

export default function StoreSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [storeName, setStoreName] = useState('')
  const [storeSlug, setStoreSlug] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('')
  const [selectedArea, setSelectedArea] = useState<Area | null>(null)
  const [enabledCouriers, setEnabledCouriers] = useState<string[]>([])

  useEffect(() => {
    async function loadStore() {
      try {
        const res = await fetch('/api/seller/store')
        const data = await res.json()
        if (data.store) {
          setStoreName(data.store.name || '')
          setStoreSlug(data.store.slug || '')
          setDescription(data.store.description || '')
          setAddress(data.store.address || '')
          setCity(data.store.city || '')
          setProvince(data.store.province || '')

          if (data.store.area_id && data.store.city) {
            setSelectedArea({
              id: data.store.area_id,
              name: `${data.store.city}${data.store.province ? `, ${data.store.province}` : ''}`
            })
          }

          // Default to basic couriers if never set
          if (data.store.shipping_couriers && data.store.shipping_couriers.length > 0) {
            setEnabledCouriers(data.store.shipping_couriers)
          } else {
            setEnabledCouriers(['jne', 'jnt', 'sicepat', 'anteraja', 'pos', 'tiki'])
          }
        }
      } catch {
        toast.error('Gagal memuat data toko')
      } finally {
        setLoading(false)
      }
    }
    loadStore()
  }, [])

  function toggleCourier(courierId: string) {
    setEnabledCouriers((prev) =>
      prev.includes(courierId)
        ? prev.filter(id => id !== courierId)
        : [...prev, courierId]
    )
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    if (enabledCouriers.length === 0) {
      toast.error('Pilih minimal satu kurir pengiriman!')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/seller/store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: storeName,
          slug: storeSlug,
          description,
          address,
          city,
          province,
          area_id: selectedArea?.id || null,
          shipping_couriers: enabledCouriers
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal menyimpan pengaturan')
      }

      toast.success('Pengaturan toko berhasil disimpan!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Pengaturan Toko</h1>
        <p className="text-sm text-gray-500">Kelola profil toko dan layanan pengiriman</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Store className="h-5 w-5" /> Informasi Dasar
            </CardTitle>
            <CardDescription>Detail utama bisnis Anda yang akan dilihat pelanggan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="storeName">Nama Toko *</Label>
                <Input
                  id="storeName"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeSlug">URL Toko (Slug) *</Label>
                <Input
                  id="storeSlug"
                  value={storeSlug}
                  onChange={(e) => setStoreSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  required
                />
                <p className="text-xs text-gray-500">tokoblitar.com/store/{storeSlug || '...'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi Singkat</Label>
              <Textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ceritakan tentang toko Anda..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" /> Lokasi Toko
            </CardTitle>
            <CardDescription>Alamat ini digunakan untuk menghitung ongkos kirim asal.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Alamat Jalan</Label>
                <Textarea
                  id="address"
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Nama jalan, gedung, RT/RW..."
                />
              </div>

              <AreaSearch
                label="Wilayah Toko (Kecamatan / Kota)"
                placeholder="Ketik kecamatan toko..."
                defaultValue={selectedArea}
                onSelect={(area) => {
                  if (area) {
                    setSelectedArea(area)
                    const parts = area.name.split(',').map(s => s.trim())
                    setCity(parts.length > 1 ? parts[1] : area.name)
                    setProvince(parts.length > 2 ? parts[2] : '')
                  } else {
                    setSelectedArea(null)
                    setCity('')
                    setProvince('')
                  }
                }}
              />

              {(city || province) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Kota/Kabupaten</Label>
                    <Input value={city} readOnly className="bg-gray-50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Provinsi</Label>
                    <Input value={province} readOnly className="bg-gray-50" />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Shipping settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="h-5 w-5" /> Layanan Pengiriman
            </CardTitle>
            <CardDescription>Pilih kurir apa saja yang Anda gunakan untuk mengirim pesanan.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {AVAILABLE_COURIERS.map((courier) => (
                <div
                  key={courier.id}
                  className={`flex items-start space-x-3 rounded-lg border p-4 transition-colors ${enabledCouriers.includes(courier.id) ? 'border-blue-500 bg-blue-50/50' : 'bg-white'
                    }`}
                >
                  <Checkbox
                    id={`courier-${courier.id}`}
                    checked={enabledCouriers.includes(courier.id)}
                    onCheckedChange={() => toggleCourier(courier.id)}
                  />
                  <div className="space-y-1 leading-none">
                    <Label
                      htmlFor={`courier-${courier.id}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {courier.name}
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-12">
          <Button type="button" variant="outline" onClick={() => window.location.reload()}>
            Batal
          </Button>
          <Button type="submit" disabled={saving || !storeName || !storeSlug} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan Pengaturan
          </Button>
        </div>
      </form>
    </div>
  )
}
