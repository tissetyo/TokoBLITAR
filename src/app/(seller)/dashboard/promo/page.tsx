'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { formatDate, formatPrice } from '@/lib/utils'
import { Plus, Ticket, Trash2, X } from 'lucide-react'

interface Promo {
  id: string
  code: string
  discount_percent: number
  min_order_amount: number
  max_uses: number | null
  valid_until: string
  is_active: boolean
  created_at: string
}

export default function PromoPage() {
  const [promos, setPromos] = useState<Promo[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    code: '',
    discount_percent: 10,
    min_order_amount: 0,
    valid_until: '',
  })

  useEffect(() => { fetchPromos() }, [])

  async function fetchPromos() {
    setLoading(true)
    const res = await fetch('/api/seller/promo')
    const data = await res.json()
    setPromos(data.promos || [])
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/seller/promo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      toast.success('Promo berhasil dibuat!')
      setShowForm(false)
      setForm({ code: '', discount_percent: 10, min_order_amount: 0, valid_until: '' })
      fetchPromos()
    } else {
      const data = await res.json()
      toast.error(data.error || 'Gagal')
    }
    setSaving(false)
  }

  async function toggleActive(promo: Promo) {
    await fetch('/api/seller/promo', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: promo.id, is_active: !promo.is_active }),
    })
    fetchPromos()
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus promo ini?')) return
    await fetch(`/api/seller/promo?id=${id}`, { method: 'DELETE' })
    toast.success('Promo dihapus')
    fetchPromos()
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Promo</h1>
          <p className="text-sm text-gray-500">Kelola kode promo untuk toko Anda</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X className="mr-2 h-4 w-4" /> Batal</> : <><Plus className="mr-2 h-4 w-4" /> Buat Promo</>}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Kode Promo</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="DISKON20" />
              </div>
              <div className="space-y-1">
                <Label>Diskon (%)</Label>
                <Input type="number" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: +e.target.value })} min={1} max={100} />
              </div>
              <div className="space-y-1">
                <Label>Minimum Order (Rp)</Label>
                <Input type="number" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: +e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Berlaku Sampai</Label>
                <Input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Promo'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      ) : promos.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-500">
          <Ticket className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p>Belum ada promo. Buat promo pertama Anda!</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {promos.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-700 font-bold text-sm">
                    {p.discount_percent}%
                  </div>
                  <div>
                    <p className="font-mono font-bold">{p.code}</p>
                    <p className="text-xs text-gray-500">
                      Min: {formatPrice(p.min_order_amount)} • Sampai: {formatDate(p.valid_until)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p)} />
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
