'use client'

import { StatCard } from '@/components/shared/StatCard'
import { ShoppingBag, DollarSign, Users, Store, ArrowRight, Activity, TrendingUp, Sparkles, Building2, Ticket } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'

interface AdminDashboardContentProps {
    stats: {
        totalUsers: number
        totalStores: number
        totalProducts: number
        totalOrders: number
        totalRevenue: number
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
        storeName: string
        buyerName: string
    }[]
    recentStores: {
        id: string
        name: string
        ownerName: string
        date: string
    }[]
}

export function AdminDashboardContent({ stats, salesData, recentOrders, recentStores }: AdminDashboardContentProps) {
    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin Dashboard 👋</h1>
                        <p className="mt-1 text-sm text-slate-500 font-medium">Ringkasan performa platform <span className="text-blue-600 font-semibold">TokoBLITAR</span> hari ini.</p>
                    </div>

                    <div className="flex gap-3">
                        <Link href="/admin/stores">
                            <Button className="bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-all h-10 px-5 text-sm font-semibold rounded-full">
                                Lihat Semua Toko
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Global Stats Row */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <StatCard
                        title="Total GMV"
                        value={`Rp ${stats.totalRevenue.toLocaleString('id-ID')}`}
                        icon={DollarSign}
                        trend={{ value: 18.5, isUp: true }}
                        className="bg-white/60 backdrop-blur-md border border-slate-200/60 shadow-sm col-span-2 lg:col-span-1"
                    />
                    <StatCard
                        title="Total Toko"
                        value={stats.totalStores}
                        icon={Store}
                        trend={{ value: 4.2, isUp: true }}
                        className="bg-white/60 backdrop-blur-md border border-slate-200/60 shadow-sm"
                    />
                    <StatCard
                        title="Total Pesanan"
                        value={stats.totalOrders}
                        icon={ShoppingBag}
                        className="bg-white/60 backdrop-blur-md border border-slate-200/60 shadow-sm"
                    />
                    <StatCard
                        title="Total Produk"
                        value={stats.totalProducts}
                        icon={Building2}
                        className="bg-white/60 backdrop-blur-md border border-slate-200/60 shadow-sm"
                    />
                    <StatCard
                        title="Total Pengguna"
                        value={stats.totalUsers}
                        icon={Users}
                        className="bg-white/60 backdrop-blur-md border border-slate-200/60 shadow-sm"
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column (Chart + Quick Links) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Sales Chart */}
                        <Card className="bg-white/70 backdrop-blur-md border border-slate-200/60 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div>
                                    <CardTitle className="text-base font-bold text-slate-800">Gross Merchandise Value (GMV)</CardTitle>
                                    <CardDescription className="text-xs text-slate-500">Omset Seluruh Platform 30 Hari Terakhir</CardDescription>
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
                                                formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'GMV']}
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

                        {/* Admin Management Links */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Link href="/admin/stores">
                                <Card className="hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer shadow-sm group border-slate-200 h-full">
                                    <CardContent className="p-5 flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex flex-shrink-0 items-center justify-center group-hover:bg-blue-200 transition-colors">
                                            <Store className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-slate-800">Manajemen Toko</h3>
                                            <p className="text-xs text-slate-500">Pantau dan kelola seller</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                            <Link href="/admin/promo">
                                <Card className="hover:border-purple-300 hover:bg-purple-50/50 transition-all cursor-pointer shadow-sm group border-slate-200 h-full">
                                    <CardContent className="p-5 flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-purple-100 flex flex-shrink-0 items-center justify-center group-hover:bg-purple-200 transition-colors">
                                            <Ticket className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-slate-800">Voucher & Promo</h3>
                                            <p className="text-xs text-slate-500">Atur diskon platform</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        </div>
                    </div>

                    {/* Right Column (Lists) */}
                    <div className="space-y-6">

                        {/* Recent Orders Network */}
                        <Card className="bg-white/70 backdrop-blur-md border border-slate-200/60 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-bold text-slate-800">Transaksi Global</CardTitle>
                            </CardHeader>
                            <CardContent className="px-2 pb-4 pt-2">
                                {recentOrders.length === 0 ? (
                                    <div className="text-center py-6 px-4">
                                        <ShoppingBag className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                        <p className="text-xs text-slate-500">Belum ada transaksi di platform.</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableBody>
                                            {recentOrders.map(order => (
                                                <TableRow key={order.id} className="border-b border-slate-100/60 hover:bg-slate-50/50">
                                                    <TableCell className="py-3 px-4">
                                                        <p className="text-xs font-semibold text-slate-800 truncate">{order.buyerName}</p>
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            <Store className="h-2.5 w-2.5 text-slate-400" />
                                                            <p className="text-[10px] text-slate-500 truncate max-w-[100px]">{order.storeName}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-right">
                                                        <p className="text-xs font-bold text-slate-800">Rp {order.amount.toLocaleString('id-ID')}</p>
                                                        <Badge variant="outline" className={`mt-1 text-[9px] px-1.5 py-0 border-transparent ${order.status === 'paid' || order.status === 'delivered' ? 'bg-green-100 text-green-700' :
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

                        {/* Recent Stores */}
                        <Card className="bg-white/70 backdrop-blur-md border border-slate-200/60 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-bold text-slate-800">Toko Baru Mendaftar</CardTitle>
                                <Link href="/admin/stores" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center">
                                    Kelola <ArrowRight className="ml-1 h-3 w-3" />
                                </Link>
                            </CardHeader>
                            <CardContent className="px-2 pb-4 pt-2">
                                {recentStores.length === 0 ? (
                                    <div className="text-center py-6 px-4">
                                        <Store className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                        <p className="text-xs text-slate-500">Belum ada toko yang mendaftar.</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableBody>
                                            {recentStores.map(store => (
                                                <TableRow key={store.id} className="border-b border-slate-100/60 hover:bg-slate-50/50">
                                                    <TableCell className="py-3 px-4 flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                                                            <Store className="h-3.5 w-3.5 text-blue-500" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-semibold text-slate-800 truncate">{store.name}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[10px] text-slate-500 whitespace-nowrap">Pemilik: {store.ownerName}</span>
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
