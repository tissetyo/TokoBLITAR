'use client'

import { StatCard } from '@/components/shared/StatCard'
import { ShoppingBag, PackageSearch, DollarSign, Users } from 'lucide-react'

interface DashboardContentProps {
    stats: {
        totalProducts: number
        totalOrders: number
        totalRevenue: number
        totalCustomers: number
    }
}

export function DashboardContent({ stats }: DashboardContentProps) {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Selamat datang di TokoBLITAR 👋</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Produk"
                    value={stats.totalProducts}
                    icon={ShoppingBag}
                />
                <StatCard
                    title="Total Pesanan"
                    value={stats.totalOrders}
                    icon={PackageSearch}
                />
                <StatCard
                    title="Pendapatan"
                    value={`Rp ${stats.totalRevenue.toLocaleString('id-ID')}`}
                    icon={DollarSign}
                />
                <StatCard
                    title="Pelanggan"
                    value={stats.totalCustomers}
                    icon={Users}
                />
            </div>
        </div>
    )
}
