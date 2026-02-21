'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  ShoppingBag,
  PackageSearch,
  Truck,
  Store,
  Share2,
  Instagram,
  Ticket,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/products', label: 'Produk', icon: ShoppingBag },
  { href: '/dashboard/orders', label: 'Pesanan', icon: PackageSearch },
  { href: '/dashboard/shipping', label: 'Pengiriman', icon: Truck },
  { href: '/dashboard/store', label: 'Pengaturan Toko', icon: Store },
  { href: '/dashboard/marketplace', label: 'Marketplace', icon: Share2 },
  { href: '/dashboard/instagram', label: 'Instagram', icon: Instagram },
  { href: '/dashboard/promo', label: 'Promo', icon: Ticket },
]

export function SellerNav() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-white">
      {/* Store branding */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg font-bold text-white"
          style={{ backgroundColor: 'var(--color-tb-primary)' }}
        >
          T
        </div>
        <div>
          <p className="text-sm font-semibold">TokoBLITAR</p>
          <p className="text-xs text-gray-500">Seller Dashboard</p>
        </div>
      </div>

      <Separator />

      {/* Nav links */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'text-white'
                  : 'text-gray-700 hover:bg-gray-100',
              )}
              style={isActive ? { backgroundColor: 'var(--color-tb-primary)' } : undefined}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* Logout */}
      <div className="px-3 py-4">
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </form>
      </div>
    </aside>
  )
}
