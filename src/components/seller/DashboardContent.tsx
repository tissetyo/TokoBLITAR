'use client'

import { StatCard } from '@/components/shared/StatCard'
import { ShoppingBag, PackageSearch, DollarSign, Users, TrendingUp, AlertCircle, Package, ArrowRight, Activity, Sparkles, Truck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'

interface DashboardContentProps {
    storeName: string
    sellerName: string
    stats: {
        totalProducts: number
        totalOrders: number
        totalRevenue: number
        totalCustomers: number
    }
    salesData: {
        date: string
        amount: number
    }[]
    recentOrders: {
        id: string
        amount: number
        status: string
        date: string
        buyerName: string
    }[]
    recentProducts: {
        id: string
        name: string
        price: number
        stock: number
        status: string
        image: string | null
    }[]
}

export function DashboardContent({ storeName, sellerName, stats, salesData, recentOrders, recentProducts }: DashboardContentProps) {
    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Halo, {sellerName}! 👋</h1>
                        <p className="mt-1 text-sm text-slate-500 font-medium">Ini adalah ringkasan performa <span className="text-blue-600 font-semibold">{storeName}</span> hari ini.</p>
                    </div>

                    <div className="flex gap-3">
                        <Link href="/dashboard/products/new">
                            <Button className="bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-all h-10 px-5 text-sm font-semibold rounded-full">
                                + Tambah Produk
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* AI Recommendations Banner */}
                <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 border-none shadow-lg overflow-hidden relative">
                    <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
                    <CardContent className="p-6 sm:p-8 flex items-center justify-between relative z-10">
                        <div className="text-white space-y-2 max-w-2xl">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-yellow-300" />
                                <h2 className="text-lg font-bold">Rekomendasi Cerdas AI</h2>
                            </div>
                            <p className="text-blue-100/90 text-sm leading-relaxed">
                                {recentProducts.length > 0 && recentProducts.some(p => p.stock < 5)
                                    ? "Beberapa produk Anda hampir kehabisan stok! Segera restock agar penjualan tidak terhambat."
                                    : "Foto produk Anda sangat penting. Gunakan AI Tools untuk menyulap instruksi biasa menjadi foto studio profesional dalam detik."}
                            </p>
                        </div>
                        <Link href="/dashboard/products" className="hidden sm:block">
                            <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md rounded-full px-6 font-semibold">
                                Kelola Inventaris
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Top Stats Row */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Pendapatan"
                        value={`Rp ${stats.totalRevenue.toLocaleString('id-ID')}`}
                        icon={DollarSign}
                        trend={{ value: 12.5, isUp: true }}
                        className="bg-white/60 backdrop-blur-md border border-slate-200/60 shadow-sm"
                    />
                    <StatCard
                        title="Total Pesanan"
                        value={stats.totalOrders}
                        icon={PackageSearch}
                        trend={{ value: 5.2, isUp: true }}
                        className="bg-white/60 backdrop-blur-md border border-slate-200/60 shadow-sm"
                    />
                    <StatCard
                        title="Total Produk"
                        value={stats.totalProducts}
                        icon={ShoppingBag}
                        className="bg-white/60 backdrop-blur-md border border-slate-200/60 shadow-sm"
                    />
                    <StatCard
                        title="Total Pelanggan"
                        value={stats.totalCustomers}
                        icon={Users}
                        className="bg-white/60 backdrop-blur-md border border-slate-200/60 shadow-sm"
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column (Chart + Quick Actions) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Sales Chart */}
                        <Card className="bg-white/70 backdrop-blur-md border border-slate-200/60 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div>
                                    <CardTitle className="text-base font-bold text-slate-800">Tren Penjualan</CardTitle>
                                    <CardDescription className="text-xs text-slate-500">30 Hari Terakhir</CardDescription>
                                </div>
                                <Activity className="h-4 w-4 text-slate-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="h-[280px] w-full mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={salesData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis
                                                dataKey="date"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 11, fill: '#64748b' }}
                                                dy={10}
                                                minTickGap={30}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 11, fill: '#64748b' }}
                                                tickFormatter={(value) => `Rp${value / 1000}k`}
                                                width={65}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                                                formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Pendapatan']}
                                                labelStyle={{ color: '#475569', fontWeight: 600, marginBottom: '4px' }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="amount"
                                                stroke="#2563eb"
                                                strokeWidth={4}
                                                dot={false}
                                                activeDot={{ r: 6, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions Apps */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Link href="/dashboard/shipping">
                                <Card className="hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer shadow-sm group border-slate-200 h-full">
                                    <CardContent className="p-5 flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex flex-shrink-0 items-center justify-center group-hover:bg-blue-200 transition-colors">
                                            <Truck className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-slate-800">Cek Ongkos Kirim</h3>
                                            <p className="text-xs text-slate-500">Biteship Integration</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                            <Link href="/dashboard/marketplace">
                                <Card className="hover:border-purple-300 hover:bg-purple-50/50 transition-all cursor-pointer shadow-sm group border-slate-200 h-full">
                                    <CardContent className="p-5 flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-purple-100 flex flex-shrink-0 items-center justify-center group-hover:bg-purple-200 transition-colors">
                                            <ShoppingBag className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-slate-800">Sinkronasi Toko</h3>
                                            <p className="text-xs text-slate-500">Shopee, Tokopedia, TikTok</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        </div>
                    </div>

                    {/* Right Column (Lists) */}
                    <div className="space-y-6">
                        {/* Recent Orders */}
                        <Card className="bg-white/70 backdrop-blur-md border border-slate-200/60 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-bold text-slate-800">Pesanan Terbaru</CardTitle>
                                <Link href="/dashboard/orders" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center">
                                    Lihat Semua <ArrowRight className="ml-1 h-3 w-3" />
                                </Link>
                            </CardHeader>
                            <CardContent className="px-2 pb-4 pt-2">
                                {recentOrders.length === 0 ? (
                                    <div className="text-center py-6 px-4">
                                        <Package className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                        <p className="text-xs text-slate-500">Belum ada pesanan terbaru.</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableBody>
                                            {recentOrders.map(order => (
                                                <TableRow key={order.id} className="border-b border-slate-100/60 hover:bg-slate-50/50">
                                                    <TableCell className="py-3 px-4">
                                                        <p className="text-xs font-semibold text-slate-800 max-w-[120px] truncate">{order.buyerName}</p>
                                                        <p className="text-[10px] text-slate-500 mt-0.5">{new Date(order.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}</p>
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-right">
                                                        <p className="text-xs font-bold text-slate-800">Rp {order.amount.toLocaleString('id-ID')}</p>
                                                        <Badge variant="outline" className={`mt-1 text-[9px] px-1.5 py-0 border-transparent ${order.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                            order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                                'bg-slate-100 text-slate-700'
                                                            }`}>
                                                            {order.status.toUpperCase()}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>

                        {/* Low Stock / Recent Products */}
                        <Card className="bg-white/70 backdrop-blur-md border border-slate-200/60 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-bold text-slate-800">Daftar Produk</CardTitle>
                                <Link href="/dashboard/products" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center">
                                    Kelola <ArrowRight className="ml-1 h-3 w-3" />
                                </Link>
                            </CardHeader>
                            <CardContent className="px-2 pb-4 pt-2">
                                {recentProducts.length === 0 ? (
                                    <div className="text-center py-6 px-4">
                                        <ShoppingBag className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                        <p className="text-xs text-slate-500">Toko Anda masih kosong.</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableBody>
                                            {recentProducts.map(product => (
                                                <TableRow key={product.id} className="border-b border-slate-100/60 hover:bg-slate-50/50">
                                                    <TableCell className="py-3 px-4 flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-md bg-slate-100 border border-slate-200/60 overflow-hidden flex-shrink-0">
                                                            {product.image ? (
                                                                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <div className="h-full w-full flex items-center justify-center">
                                                                    <Package className="h-4 w-4 text-slate-300" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-semibold text-slate-800 truncate">{product.name}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[10px] text-slate-500 whitespace-nowrap">Rp {product.price.toLocaleString('id-ID')}</span>
                                                                {product.stock < 5 ? (
                                                                    <span className="text-[9px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-sm flex items-center gap-0.5 whitespace-nowrap">
                                                                        <AlertCircle className="h-2 w-2" /> Stok {product.stock}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[9px] text-slate-400 whitespace-nowrap">Stok {product.stock}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

            </div>
        </div>
    )
}
