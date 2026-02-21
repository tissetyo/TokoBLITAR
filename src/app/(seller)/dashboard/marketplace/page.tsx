'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import {
  Link2,
  Link2Off,
  RefreshCw,
  CheckCircle,
  ShoppingBag,
} from 'lucide-react'

interface PlatformConnection {
  platform: string
  connected: boolean
  connected_at: string | null
  last_sync_at: string | null
}

const PLATFORM_INFO: Record<string, { name: string; color: string; icon: string }> = {
  tokopedia: { name: 'Tokopedia', color: '#42b549', icon: '🟢' },
  shopee: { name: 'Shopee', color: '#ee4d2d', icon: '🟠' },
  lazada: { name: 'Lazada', color: '#0f136d', icon: '🔵' },
}

export default function MarketplacePage() {
  const [platforms, setPlatforms] = useState<PlatformConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [connectCode, setConnectCode] = useState('')
  const [connecting, setConnecting] = useState<string | null>(null)
  const [syncing, setSyncing] = useState<string | null>(null)

  useEffect(() => {
    fetchStatus()
  }, [])

  async function fetchStatus() {
    setLoading(true)
    try {
      const res = await fetch('/api/seller/marketplace')
      const data = await res.json()
      setPlatforms(data.platforms || [])
    } catch {
      toast.error('Gagal memuat status marketplace')
    } finally {
      setLoading(false)
    }
  }

  async function handleConnect(platform: string) {
    if (!connectCode.trim()) {
      toast.error('Masukkan kode otorisasi')
      return
    }
    setConnecting(platform)
    try {
      const res = await fetch('/api/seller/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, auth_code: connectCode }),
      })
      if (res.ok) {
        toast.success(`${PLATFORM_INFO[platform].name} berhasil terhubung!`)
        setConnectCode('')
        fetchStatus()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menghubungkan')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setConnecting(null)
    }
  }

  async function handleSync(platform: string) {
    setSyncing(platform)
    try {
      const res = await fetch('/api/seller/marketplace/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`${data.synced} produk berhasil disync ke ${PLATFORM_INFO[platform].name}`)
        fetchStatus()
      } else {
        toast.error(data.error || 'Gagal sync')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSyncing(null)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Marketplace</h1>
        <p className="text-sm text-gray-500">Hubungkan toko Anda ke marketplace dan sinkronkan produk</p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {platforms.map((p) => {
            const info = PLATFORM_INFO[p.platform]
            return (
              <Card key={p.platform} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span className="text-lg">{info.icon}</span>
                      {info.name}
                    </CardTitle>
                    <Badge variant={p.connected ? 'default' : 'secondary'}>
                      {p.connected ? (
                        <><CheckCircle className="mr-1 h-3 w-3" /> Terhubung</>
                      ) : (
                        <><Link2Off className="mr-1 h-3 w-3" /> Belum</>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {p.connected ? (
                    <>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>Terhubung: {p.connected_at ? formatDate(p.connected_at) : '-'}</p>
                        <p>Sync terakhir: {p.last_sync_at ? formatDate(p.last_sync_at) : 'Belum pernah'}</p>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => handleSync(p.platform)}
                        disabled={syncing === p.platform}
                      >
                        {syncing === p.platform ? (
                          <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Syncing...</>
                        ) : (
                          <><RefreshCw className="mr-2 h-4 w-4" /> Sync Produk</>
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Input
                        placeholder="Kode otorisasi"
                        value={connecting === p.platform ? connectCode : ''}
                        onChange={(e) => { setConnecting(p.platform); setConnectCode(e.target.value) }}
                        className="text-sm"
                      />
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => handleConnect(p.platform)}
                        disabled={connecting === p.platform && !connectCode}
                      >
                        <Link2 className="mr-2 h-4 w-4" />
                        Hubungkan
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
