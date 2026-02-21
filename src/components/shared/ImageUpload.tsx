'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X } from 'lucide-react'

interface ImageUploadProps {
  onUpload: (url: string) => void
  aspect?: 'square' | 'banner'
  placeholder?: string
}

export function ImageUpload({ onUpload, aspect = 'square', placeholder = 'Upload gambar' }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    // Show local preview immediately
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)

    setUploading(true)
    try {
      // Get presigned URL from our API
      const res = await fetch('/api/seller/store?upload=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type,
        }),
      })

      if (!res.ok) {
        // R2 not configured yet — use local preview as fallback
        onUpload(localUrl)
        setUploading(false)
        return
      }

      const { upload_url, public_url } = await res.json()

      // Upload directly to R2
      await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })

      setPreview(public_url)
      onUpload(public_url)
    } catch {
      // Fallback: use local preview
      onUpload(localUrl)
    } finally {
      setUploading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleRemove() {
    setPreview(null)
    onUpload('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const aspectClass = aspect === 'banner' ? 'aspect-[16/9]' : 'aspect-square'

  return (
    <div className={`relative w-full overflow-hidden rounded-lg border-2 border-dashed border-gray-300 ${aspectClass}`}>
      {preview ? (
        <>
          <img
            src={preview}
            alt="Preview"
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
          >
            <X className="h-4 w-4" />
          </button>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          )}
        </>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Upload className="h-8 w-8" />
          <span className="text-sm">{placeholder}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}
