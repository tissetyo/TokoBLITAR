'use client'

import { SellerNav } from '@/components/layout/SellerNav'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <SellerNav />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      {/* AISidebar placeholder — will be wired in Sprint 4 */}
    </div>
  )
}
