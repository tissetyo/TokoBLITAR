'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { Instagram, Send, Clock, Image, Eye } from 'lucide-react'

interface IGPost {
  id: string
  caption: string
  image_url: string
  status: string
  scheduled_at: string | null
  created_at: string
}

export default function InstagramPage() {
  const [posts, setPosts] = useState<IGPost[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    caption: '',
    image_url: '',
    scheduled_at: '',
  })

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    setLoading(true)
    try {
      const res = await fetch('/api/seller/instagram')
      const data = await res.json()
      setPosts(data.posts || [])
    } catch { /* empty */ }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.caption || !form.image_url) {
      toast.error('Caption dan URL gambar wajib diisi')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/seller/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: form.caption,
          image_url: form.image_url,
          scheduled_at: form.scheduled_at || null,
        }),
      })

      if (res.ok) {
        toast.success(form.scheduled_at ? 'Post dijadwalkan!' : 'Draft berhasil disimpan!')
        setForm({ caption: '', image_url: '', scheduled_at: '' })
        fetchPosts()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal membuat post')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const statusColor: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    scheduled: 'bg-blue-100 text-blue-800',
    published: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Instagram className="h-6 w-6" /> Instagram
        </h1>
        <p className="text-sm text-gray-500">Buat dan jadwalkan posting Instagram untuk produk Anda</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Buat Post Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label>URL Gambar</Label>
                <Input
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              {/* Preview */}
              {form.image_url && (
                <div className="aspect-square max-w-[240px] overflow-hidden rounded-lg border bg-gray-100">
                  <img src={form.image_url} alt="Preview" className="h-full w-full object-cover" />
                </div>
              )}

              <div className="space-y-1">
                <Label>Caption</Label>
                <Textarea
                  value={form.caption}
                  onChange={(e) => setForm({ ...form, caption: e.target.value })}
                  rows={4}
                  placeholder="Tulis caption Instagram..."
                />
                <p className="text-xs text-gray-400">{form.caption.length}/2200</p>
              </div>

              <div className="space-y-1">
                <Label>Jadwalkan (opsional)</Label>
                <Input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? 'Menyimpan...' : form.scheduled_at ? (
                    <><Clock className="mr-2 h-4 w-4" /> Jadwalkan</>
                  ) : (
                    <><Send className="mr-2 h-4 w-4" /> Simpan Draft</>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Post History */}
        <div className="space-y-3">
          <h2 className="font-semibold">Riwayat Post</h2>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <Image className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                <p>Belum ada post</p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id}>
                <CardContent className="flex gap-3 py-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-gray-100">
                    <img src={post.image_url} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm line-clamp-2">{post.caption}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="secondary" className={statusColor[post.status] || ''}>
                        {post.status}
                      </Badge>
                      <span className="text-xs text-gray-400">{formatDate(post.created_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
