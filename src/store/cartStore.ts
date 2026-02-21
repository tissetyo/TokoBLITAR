'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
    product_id: string
    name: string
    price: number
    quantity: number
    image_url: string
}

interface CartStore {
    items: CartItem[]
    addItem: (item: CartItem) => void
    removeItem: (product_id: string) => void
    updateQty: (product_id: string, quantity: number) => void
    clear: () => void
    total: () => number
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (item) =>
                set((s) => {
                    const exists = s.items.find((i) => i.product_id === item.product_id)
                    if (exists) {
                        return {
                            items: s.items.map((i) =>
                                i.product_id === item.product_id
                                    ? { ...i, quantity: i.quantity + item.quantity }
                                    : i,
                            ),
                        }
                    }
                    return { items: [...s.items, item] }
                }),
            removeItem: (id) =>
                set((s) => ({ items: s.items.filter((i) => i.product_id !== id) })),
            updateQty: (id, qty) =>
                set((s) => ({
                    items: s.items.map((i) =>
                        i.product_id === id ? { ...i, quantity: qty } : i,
                    ),
                })),
            clear: () => set({ items: [] }),
            total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        }),
        { name: 'tokoblitar-cart' },
    ),
)
