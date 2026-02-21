'use client'

import { useState } from 'react'
import { MapPin } from 'lucide-react'

interface MapPickerProps {
  onSelect: (lat: number, lng: number) => void
}

// Default: Kabupaten Blitar
const DEFAULT_LAT = -8.0983
const DEFAULT_LNG = 112.1681

export function MapPicker({ onSelect }: MapPickerProps) {
  const [selected, setSelected] = useState<{ lat: number; lng: number } | null>(null)

  function handleMapClick() {
    // Use browser geolocation as a starting point
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          setSelected({ lat, lng })
          onSelect(lat, lng)
        },
        () => {
          // Fallback to Blitar center
          setSelected({ lat: DEFAULT_LAT, lng: DEFAULT_LNG })
          onSelect(DEFAULT_LAT, DEFAULT_LNG)
        },
      )
    } else {
      setSelected({ lat: DEFAULT_LAT, lng: DEFAULT_LNG })
      onSelect(DEFAULT_LAT, DEFAULT_LNG)
    }
  }

  const mapSrc = selected
    ? `https://maps.google.com/maps?q=${selected.lat},${selected.lng}&z=15&output=embed`
    : `https://maps.google.com/maps?q=${DEFAULT_LAT},${DEFAULT_LNG}&z=12&output=embed`

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border">
        <iframe
          src={mapSrc}
          width="100%"
          height="300"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Map"
        />
      </div>

      {selected ? (
        <p className="flex items-center gap-1 text-sm text-green-600">
          <MapPin className="h-4 w-4" />
          {selected.lat.toFixed(6)}, {selected.lng.toFixed(6)}
        </p>
      ) : (
        <button
          type="button"
          onClick={handleMapClick}
          className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <MapPin className="h-4 w-4" />
          Gunakan lokasi saya saat ini
        </button>
      )}
    </div>
  )
}
