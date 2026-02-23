'use client'

import * as React from 'react'
import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Search } from 'lucide-react'

interface Area {
    id: string
    name: string
}

interface AreaSearchProps {
    label: string
    placeholder?: string
    onSelect: (area: Area | null) => void
    defaultValue?: Area | null
}

export function AreaSearch({ label, placeholder = 'Cari kecamatan / kota...', onSelect, defaultValue }: AreaSearchProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Area[]>([])
    const [loading, setLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [selectedArea, setSelectedArea] = useState<Area | null>(defaultValue || null)
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (selectedArea && query === selectedArea.name) return

        if (query.length < 3) {
            setResults([])
            setIsOpen(false)
            return
        }

        const timer = setTimeout(async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/biteship/areas?input=${encodeURIComponent(query)}`)
                const data = await res.json()
                setResults(data.areas || [])
                setIsOpen(true)
            } catch (e) {
                console.error('Failed to fetch areas', e)
            } finally {
                setLoading(false)
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [query, selectedArea])

    const handleSelect = (area: Area) => {
        setQuery(area.name)
        setSelectedArea(area)
        setIsOpen(false)
        onSelect(area)
    }

    const handleClear = () => {
        setQuery('')
        setSelectedArea(null)
        setIsOpen(false)
        onSelect(null)
    }

    return (
        <div className="space-y-2 relative" ref={wrapperRef}>
            <Label>{label}</Label>
            <div className="relative">
                <Input
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        if (selectedArea && e.target.value !== selectedArea.name) {
                            setSelectedArea(null)
                            onSelect(null)
                        }
                    }}
                    onFocus={() => {
                        if (results.length > 0 && query.length >= 3) setIsOpen(true)
                    }}
                    placeholder={placeholder}
                    className="pr-10"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </div>
                {selectedArea && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute inset-y-0 right-8 flex items-center pr-2 text-red-400 hover:text-red-500 text-xs font-semibold"
                    >
                        Hapus
                    </button>
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {results.map((area) => (
                        <div
                            key={area.id}
                            className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 border-b last:border-0"
                            onClick={() => handleSelect(area)}
                        >
                            {area.name}
                        </div>
                    ))}
                </div>
            )}
            {isOpen && results.length === 0 && !loading && query.length >= 3 && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg p-4 text-sm text-center text-gray-500">
                    Area tidak ditemukan
                </div>
            )}
        </div>
    )
}
