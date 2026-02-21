'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Image, Plus, Trash2, X } from 'lucide-react'

interface Banner {
  id: string
  image_url: string
  cta_link: string
  sort_order: number
  is_active: boolean
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ image_url: '', cta_link: '' })

  useEffect(() => {
    // Placeholder — in production fetch from /api/admin/banners
    setLoading(false)
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.image_url) {
      toast.error('URL gambar wajib diisi')
      return
    }
    // Placeholder: would POST to /api/admin/banners
    toast.success('Banner ditambahkan')
    setShowForm(false)
    setForm({ image_url: '', cta_link: '' })
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Banner</h1>
          <p className="text-sm text-gray-500">Kelola banner homepage</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X className="mr-2 h-4 w-4" /> Batal</> : <><Plus className="mr-2 h-4 w-4" /> Tambah Banner</>}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>URL Gambar</Label>
                <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="space-y-1">
                <Label>Link CTA</Label>
                <Input value={form.cta_link} onChange={(e) => setForm({ ...form, cta_link: e.target.value })} placeholder="/products" />
              </div>
              <Button type="submit">Simpan Banner</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
        </div>
      ) : banners.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-500">
          <Image className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p>Belum ada banner</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {banners.map((b) => (
            <Card key={b.id} className="overflow-hidden">
              <img src={b.image_url} alt="" className="h-40 w-full object-cover" />
              <CardContent className="flex items-center justify-between py-3">
                <p className="text-sm text-gray-600 truncate">{b.cta_link}</p>
                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
