'use client'

import { SellerNav } from './SellerNav'
import { AISidebar } from '@/components/ai/AISidebar'
import { useAIStore } from '@/store/aiSessionStore'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const isOpen = useAIStore((s) => s.isOpen)
  const toggleSidebar = useAIStore((s) => s.toggleSidebar)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Nav */}
      <SellerNav />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* AI Sidebar */}
      {isOpen && (
        <aside className="hidden w-[340px] shrink-0 lg:block">
          <AISidebar />
        </aside>
      )}

      {/* AI Toggle Button (when sidebar is closed) */}
      {!isOpen && (
        <Button
          onClick={toggleSidebar}
          size="icon"
          className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg"
          style={{ backgroundColor: 'var(--color-tb-primary)' }}
        >
          <Sparkles className="h-5 w-5 text-white" />
        </Button>
      )}
    </div>
  )
}
