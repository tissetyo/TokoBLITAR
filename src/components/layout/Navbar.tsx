"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useEffect, useState } from "react";

export function Navbar() {
  const items = useCartStore((s) => s.items);
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch for persisted Zustand store
  useEffect(() => {
    setMounted(true);
  }, []);

  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black">
            <span className="text-sm font-bold text-white">T</span>
          </div>
          <span className="text-sm font-semibold">TokoBLITAR</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/products"
            className="text-sm text-gray-600 hover:text-black transition-colors"
          >
            Produk
          </Link>
          <Link
            href="/cart"
            className="relative text-gray-600 hover:text-black transition-colors"
          >
            <ShoppingCart className="h-5 w-5" />
            {mounted && cartItemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {cartItemCount}
              </span>
            )}
          </Link>
          <div className="h-4 w-px bg-gray-200" />
          <Link href="/login">
            <Button variant="outline" size="sm" className="rounded-full">
              Masuk
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
