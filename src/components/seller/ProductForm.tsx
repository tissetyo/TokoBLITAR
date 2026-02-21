'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ImageUpload } from '@/components/shared/ImageUpload'
import { toast } from 'sonner'
import { ArrowLeft, Save, Plus, X } from 'lucide-react'

const productSchema = z.object({
  name: z.string().min(2, 'Nama produk minimal 2 karakter'),
  description: z.string().optional(),
  price: z.number({ message: 'Harga harus berupa angka' }).positive('Harga harus lebih dari 0'),
  stock: z.number().int().min(0),
  weight_gram: z.number().int().min(0),
  category_id: z.string().optional().nullable(),
  status: z.enum(['active', 'draft', 'archived']),
})

type ProductForm = z.infer<typeof productSchema>

interface ProductFormProps {
  initialData?: ProductForm & { id?: string }
  categories?: { id: string; name: string }[]
}

export function ProductForm({ initialData, categories = [] }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<{ url: string; is_primary: boolean; sort_order: number }[]>([])
  const isEdit = !!initialData?.id

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      price: 0,
      stock: 0,
      weight_gram: 0,
      status: 'draft',
    },
  })

  const watchStatus = watch('status')

  function addImage(url: string) {
    if (images.length >= 8) {
      toast.error('Maksimal 8 gambar')
      return
    }
    setImages((prev) => [
      ...prev,
      { url, is_primary: prev.length === 0, sort_order: prev.length },
    ])
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index)
      // Ensure at least one primary
      if (next.length > 0 && !next.some((img) => img.is_primary)) {
        next[0].is_primary = true
      }
      return next.map((img, i) => ({ ...img, sort_order: i }))
    })
  }

  function setPrimary(index: number) {
    setImages((prev) =>
      prev.map((img, i) => ({ ...img, is_primary: i === index })),
    )
  }

  async function onSubmit(data: ProductForm) {
    setLoading(true)
    try {
      const url = isEdit
        ? `/api/seller/products/${initialData!.id}`
        : '/api/seller/products'

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          images: isEdit ? undefined : images,
        }),
      })

      if (!res.ok) {
        const result = await res.json()
        toast.error(result.error || 'Gagal menyimpan produk')
        setLoading(false)
        return
      }

      toast.success(isEdit ? 'Produk diperbarui' : 'Produk dibuat!')
      router.push('/dashboard/products')
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan')
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit Produk' : 'Tambah Produk'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader><CardTitle>Informasi Produk</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Produk</Label>
              <Input id="name" placeholder="Contoh: Batik Tulis Khas Blitar" {...register('name')} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                placeholder="Deskripsikan produk Anda..."
                rows={5}
                {...register('description')}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="price">Harga (Rp)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="50000"
                  {...register('price', { valueAsNumber: true })}
                />
                {errors.price && <p className="text-sm text-red-500">{errors.price.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stok</Label>
                <Input
                  id="stock"
                  type="number"
                  placeholder="100"
                  {...register('stock', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Berat (gram)</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="500"
                  {...register('weight_gram', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select onValueChange={(val) => setValue('category_id', val)}>
                  <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={watchStatus} onValueChange={(val) => setValue('status', val as 'active' | 'draft' | 'archived')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="archived">Arsip</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        {!isEdit && (
          <Card>
            <CardHeader><CardTitle>Foto Produk (maks. 8)</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3">
                {images.map((img, i) => (
                  <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border">
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => setPrimary(i)}
                        className="rounded bg-white px-2 py-1 text-xs font-medium"
                      >
                        {img.is_primary ? '★ Utama' : 'Jadikan Utama'}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="rounded bg-red-500 p-1 text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    {img.is_primary && (
                      <span className="absolute left-1 top-1 rounded bg-yellow-400 px-1.5 py-0.5 text-[10px] font-bold">
                        UTAMA
                      </span>
                    )}
                  </div>
                ))}
                {images.length < 8 && (
                  <div className="aspect-square">
                    <ImageUpload
                      onUpload={addImage}
                      aspect="square"
                      placeholder="+ Foto"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Batal
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Menyimpan...' : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEdit ? 'Simpan Perubahan' : 'Buat Produk'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
