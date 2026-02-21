'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ImageUpload } from '@/components/shared/ImageUpload'
import { MapPicker } from '@/components/shared/MapPicker'
import { toast } from 'sonner'
import { generateSlug } from '@/lib/utils'
import {
  Check,
  Store as StoreIcon,
  Image as ImageIcon,
  FileText,
  MapPin,
  Share2,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'

const storeSchema = z.object({
  name: z.string().min(3, 'Nama toko minimal 3 karakter'),
  slug: z.string().min(3, 'Slug minimal 3 karakter')
    .regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan strip'),
  logo_url: z.string().optional(),
  banner_url: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  google_maps_url: z.string().optional(),
  instagram_handle: z.string().optional(),
})

type StoreForm = z.infer<typeof storeSchema>

const steps = [
  { title: 'Nama Toko', icon: StoreIcon },
  { title: 'Logo & Banner', icon: ImageIcon },
  { title: 'Deskripsi', icon: FileText },
  { title: 'Lokasi', icon: MapPin },
  { title: 'Marketplace', icon: Share2 },
  { title: 'Produk Pertama', icon: ShoppingBag },
]

export function OnboardingStepper() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)

  const methods = useForm<StoreForm>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      category: '',
      address: '',
      instagram_handle: '',
    },
  })

  const { register, setValue, watch, trigger, formState: { errors } } = methods

  const watchName = watch('name')
  const watchSlug = watch('slug')

  // Auto-generate slug from name
  const handleNameChange = useCallback((value: string) => {
    setValue('name', value)
    const slug = generateSlug(value)
    setValue('slug', slug)
    setSlugAvailable(null)
  }, [setValue])

  // Check slug availability
  async function checkSlug() {
    const slug = watchSlug
    if (!slug || slug.length < 3) return

    setCheckingSlug(true)
    try {
      const res = await fetch(`/api/seller/store?check_slug=${slug}`)
      const data = await res.json()
      setSlugAvailable(data.available)
    } catch {
      setSlugAvailable(null)
    } finally {
      setCheckingSlug(false)
    }
  }

  async function handleNext() {
    // Validate current step fields
    if (currentStep === 0) {
      const valid = await trigger(['name', 'slug'])
      if (!valid) return
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1)
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
    }
  }

  async function handleComplete() {
    setLoading(true)
    try {
      const data = methods.getValues()

      const res = await fetch('/api/seller/store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const result = await res.json()
        toast.error(result.error || 'Gagal menyimpan toko')
        setLoading(false)
        return
      }

      toast.success('Toko berhasil dibuat! 🎉')
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan')
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      {/* Progress */}
      <div className="mb-8">
        <Progress value={((currentStep + 1) / steps.length) * 100} className="h-2" />
        <div className="mt-4 flex justify-between">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className={`flex flex-col items-center gap-1 text-xs ${i <= currentStep ? 'text-gray-900' : 'text-gray-400'
                }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors ${i < currentStep
                    ? 'bg-green-500 text-white'
                    : i === currentStep
                      ? 'text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                style={i === currentStep ? { backgroundColor: 'var(--color-tb-primary)' } : undefined}
              >
                {i < currentStep ? <Check className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
              </div>
              <span className="hidden sm:block">{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
        </CardHeader>
        <CardContent>
          <FormProvider {...methods}>
            {/* Step 1: Store Name & Slug */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Toko</Label>
                  <Input
                    id="name"
                    placeholder="Contoh: Batik Blitar Indah"
                    value={watchName}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Toko</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">tokoblitar.com/store/</span>
                    <Input
                      id="slug"
                      placeholder="batik-blitar-indah"
                      {...register('slug')}
                      onBlur={checkSlug}
                    />
                  </div>
                  {checkingSlug && <p className="text-sm text-gray-500">Memeriksa ketersediaan...</p>}
                  {slugAvailable === true && <p className="text-sm text-green-600">✓ Slug tersedia</p>}
                  {slugAvailable === false && <p className="text-sm text-red-500">✗ Slug sudah digunakan</p>}
                  {errors.slug && <p className="text-sm text-red-500">{errors.slug.message}</p>}
                </div>
              </div>
            )}

            {/* Step 2: Logo & Banner */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Logo Toko</Label>
                  <ImageUpload
                    onUpload={(url) => setValue('logo_url', url)}
                    aspect="square"
                    placeholder="Upload logo (1:1)"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Banner Toko</Label>
                  <ImageUpload
                    onUpload={(url) => setValue('banner_url', url)}
                    aspect="banner"
                    placeholder="Upload banner (16:9)"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Description */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi Toko</Label>
                  <Textarea
                    id="description"
                    placeholder="Ceritakan tentang toko Anda..."
                    rows={5}
                    {...register('description')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram (opsional)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">@</span>
                    <Input
                      id="instagram"
                      placeholder="username_instagram"
                      {...register('instagram_handle')}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Location */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Alamat Toko</Label>
                  <Textarea
                    id="address"
                    placeholder="Jl. Contoh No. 123, Kecamatan, Blitar"
                    rows={2}
                    {...register('address')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lokasi di Peta</Label>
                  <MapPicker
                    onSelect={(lat, lng) => {
                      setValue('lat', lat)
                      setValue('lng', lng)
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="google_maps_url">Link Google Maps (opsional)</Label>
                  <Input
                    id="google_maps_url"
                    placeholder="https://maps.google.com/..."
                    {...register('google_maps_url')}
                  />
                </div>
              </div>
            )}

            {/* Step 5: Marketplace Connect (placeholder) */}
            {currentStep === 4 && (
              <div className="space-y-4 text-center py-8">
                <Share2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="text-lg font-medium">Hubungkan Marketplace</h3>
                <p className="text-sm text-gray-500">
                  Fitur sinkronisasi Tokopedia, Shopee, dan Lazada akan tersedia segera.
                  Anda bisa melewati langkah ini.
                </p>
              </div>
            )}

            {/* Step 6: First Product (placeholder) */}
            {currentStep === 5 && (
              <div className="space-y-4 text-center py-8">
                <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="text-lg font-medium">Tambah Produk Pertama</h3>
                <p className="text-sm text-gray-500">
                  Anda bisa menambahkan produk nanti dari halaman dashboard.
                  Klik &quot;Selesai&quot; untuk menyelesaikan setup toko.
                </p>
              </div>
            )}
          </FormProvider>

          {/* Navigation buttons */}
          <div className="mt-8 flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext}>
                {currentStep === 4 ? 'Lewati' : 'Lanjut'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={loading}>
                {loading ? 'Menyimpan...' : 'Selesai 🎉'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
