'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ChevronLeft, Truck, Package, MapPin, Search, Loader2 } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function SellerOrderDetailPage() {
    const params = useParams()
    const router = useRouter()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const [trackingCode, setTrackingCode] = useState('')
    const [savingTracking, setSavingTracking] = useState(false)

    useEffect(() => {
        async function loadOrder() {
            try {
                const res = await fetch(`/api/seller/orders/${params.id}`)
                const data = await res.json()
                if (data.order) {
                    setOrder(data.order)
                    if (data.order.shipping_tracking_code) {
                        setTrackingCode(data.order.shipping_tracking_code)
                    }
                }
            } catch {
                toast.error('Gagal memuat pesanan')
            } finally {
                setLoading(false)
            }
        }
        if (params.id) loadOrder()
    }, [params.id])

    async function handleSaveTracking(e: React.FormEvent) {
        e.preventDefault()
        if (!trackingCode) return toast.error('Masukkan nomor resi')

        setSavingTracking(true)
        try {
            const res = await fetch(`/api/seller/orders/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shipping_tracking_code: trackingCode,
                    status: 'shipped' // auto update status when tracking is added
                })
            })

            if (!res.ok) throw new Error('Gagal menyimpan resi')

            toast.success('Resi berhasil disimpan dan status diubah ke Dikirim')
            setOrder({ ...order, shipping_tracking_code: trackingCode, status: 'shipped' })
        } catch {
            toast.error('Gagal menyimpan nomor resi')
        } finally {
            setSavingTracking(false)
        }
    }

    if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
    if (!order) return <div className="p-6">Pesanan tidak ditemukan</div>

    const statusColor: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800',
        paid: 'bg-blue-100 text-blue-800',
        processing: 'bg-indigo-100 text-indigo-800',
        shipped: 'bg-orange-100 text-orange-800',
        delivered: 'bg-green-100 text-green-800',
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6 flex space-x-4 items-center">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        Detail Pesanan
                        <Badge className={statusColor[order.status] || ''}>{order.status}</Badge>
                    </h1>
                    <p className="text-sm text-gray-500">ID: {order.id}</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Col: Order Items & Delivery */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Package className="h-5 w-5" /> Produk Dipesan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="divide-y">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {order.order_items?.map((item: any) => (
                                    <div key={item.id} className="py-3 flex justify-between">
                                        <div>
                                            <p className="font-medium">{item.products?.name}</p>
                                            <p className="text-sm text-gray-500">{item.quantity} x {formatPrice(item.unit_price)}</p>
                                        </div>
                                        <p className="font-bold">{formatPrice(item.subtotal)}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MapPin className="h-5 w-5" /> Informasi Pengiriman
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg text-sm">
                                <p className="font-semibold mb-1">{order.shipping_address?.name}</p>
                                <p className="text-gray-600 mb-1">{order.shipping_address?.phone}</p>
                                <p className="text-gray-600">
                                    {order.shipping_address?.street}, {order.shipping_address?.city}, {order.shipping_address?.province} {order.shipping_address?.postal_code}
                                </p>
                            </div>

                            <div className="flex justify-between items-center py-2 border-t mt-4">
                                <div>
                                    <p className="font-medium text-sm text-gray-500">Kurir Pilihan Pembeli</p>
                                    <p className="font-bold">{order.shipping_address?.courier || 'Reguler'}</p>
                                    <p className="text-xs text-gray-500">Estimasi: {order.shipping_address?.duration || '-'}</p>
                                </div>
                                <p className="font-bold text-blue-600">{formatPrice(order.shipping_address?.shipping_cost || 0)}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Col: Tracking & Summary */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Tracking Input */}
                    <Card className={order.status === 'pending' ? 'opacity-50 pointer-events-none' : ''}>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Truck className="h-5 w-5" /> Nomor Resi
                            </CardTitle>
                            <CardDescription>Masukkan resi pengiriman agar pembeli dapat melacak paket</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSaveTracking} className="space-y-3">
                                <Label>Nomor Resi / AWB</Label>
                                <Input
                                    value={trackingCode}
                                    onChange={e => setTrackingCode(e.target.value)}
                                    placeholder="Contoh: JP012345678"
                                    required
                                />
                                <Button type="submit" className="w-full" disabled={savingTracking}>
                                    {savingTracking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                    Simpan & Kirim Pesanan
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Payment Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Ringkasan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Tanggal Order</span>
                                <span className="font-medium">{formatDate(order.created_at)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Total Harga</span>
                                <span className="font-bold text-lg" style={{ color: 'var(--color-tb-primary)' }}>
                                    {formatPrice(order.total_amount)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
