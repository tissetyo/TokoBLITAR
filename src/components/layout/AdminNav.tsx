'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Store,
    Package,
    Ticket,
    Image,
    LogOut,
    Shield,
} from 'lucide-react'

const NAV_ITEMS = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/stores', label: 'Toko', icon: Store },
    { href: '/admin/products', label: 'Produk', icon: Package },
    { href: '/admin/promo', label: 'Promo', icon: Ticket },
    { href: '/admin/banners', label: 'Banner', icon: Image },
]

export function AdminNav() {
    const pathname = usePathname()

    return (
        <aside className="flex h-screen w-56 shrink-0 flex-col border-r bg-white">
            <div className="flex items-center gap-2 border-b px-4 py-4">
                <Shield className="h-5 w-5" style={{ color: 'var(--color-tb-primary)' }} />
                <span className="text-sm font-bold">Admin Panel</span>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname.startsWith(item.href)
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${isActive
                                    ? 'bg-gray-100 font-medium text-gray-900'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            <div className="border-t px-3 py-3">
                <Link
                    href="/api/auth/logout"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </Link>
            </div>
        </aside>
    )
}
