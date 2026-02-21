'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    isStreaming?: boolean
}

interface AIStore {
    messages: Message[]
    isOpen: boolean
    isStreaming: boolean
    addMessage: (msg: Omit<Message, 'id'>) => string
    updateMessage: (id: string, content: string) => void
    toggleSidebar: () => void
    setStreaming: (v: boolean) => void
    clear: () => void
}

export const useAIStore = create<AIStore>()(
    persist(
        (set, get) => ({
            messages: [],
            isOpen: true,
            isStreaming: false,
            addMessage: (msg) => {
                const id = crypto.randomUUID()
                set((s) => ({ messages: [...s.messages, { ...msg, id }] }))
                return id
            },
            updateMessage: (id, content) =>
                set((s) => ({
                    messages: s.messages.map((m) => (m.id === id ? { ...m, content, isStreaming: false } : m)),
                })),
            toggleSidebar: () => set((s) => ({ isOpen: !s.isOpen })),
            setStreaming: (v) => set({ isStreaming: v }),
            clear: () => set({ messages: [] }),
        }),
        {
            name: 'tokoblitar-ai',
            partialize: (state) => ({
                messages: state.messages.filter((m) => !m.isStreaming),
                isOpen: state.isOpen,
            }),
        },
    ),
)
