'use client'

import { useState, useRef, useEffect } from 'react'
import { useAIStore } from '@/store/aiSessionStore'
import { useAI } from '@/hooks/useAI'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
    Send,
    X,
    Sparkles,
    StopCircle,
    Trash2,
    ChevronDown,
} from 'lucide-react'

const QUICK_ACTIONS = [
    { label: '🏪 Setup Toko', prompt: 'Bantu saya setup toko baru' },
    { label: '📦 Tambah Produk', prompt: 'Saya ingin menambahkan produk baru' },
    { label: '🏷️ Buat Promo', prompt: 'Buatkan promo diskon 20% untuk semua produk' },
    { label: '📊 Ringkasan', prompt: 'Tampilkan ringkasan penjualan toko saya' },
]

export function AISidebar() {
    const { messages, isStreaming, isOpen, toggleSidebar, clear, model, setModel } = useAIStore()
    const { send, stop } = useAI()
    const [input, setInput] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const MODELS = [
        { id: 'gemini-2.0-flash-lite', label: 'Flash Lite', desc: 'Tercepat & gratis' },
        { id: 'gemini-2.0-flash', label: 'Flash', desc: 'Cepat & akurat' },
        { id: 'gemini-2.5-flash-preview-05-20', label: '2.5 Flash', desc: 'Terbaru' },
        { id: 'gemini-2.5-pro-preview-05-06', label: '2.5 Pro', desc: 'Terpintar' },
    ]

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    function handleSend() {
        const msg = input.trim()
        if (!msg || isStreaming) return
        setInput('')
        send(msg)
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    if (!isOpen) return null

    return (
        <div className="flex h-full w-full flex-col border-l bg-white">
            {/* Header */}
            <div className="border-b px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" style={{ color: 'var(--color-tb-primary)' }} />
                        <h2 className="text-sm font-semibold">Asisten AI</h2>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={clear} title="Hapus percakapan">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                {/* Model selector */}
                <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400 shrink-0">Model:</span>
                    <select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="flex-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] text-gray-600 outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-100"
                    >
                        {MODELS.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.label} — {m.desc}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
                {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                        <Sparkles className="h-10 w-10 text-gray-300" />
                        <div>
                            <p className="font-medium text-gray-700">Halo! Saya asisten AI Anda</p>
                            <p className="mt-1 text-sm text-gray-500">
                                Saya bisa membantu mengelola toko, produk, dan promo
                            </p>
                        </div>
                        {/* Quick actions */}
                        <div className="grid w-full grid-cols-2 gap-2">
                            {QUICK_ACTIONS.map((action) => (
                                <button
                                    key={action.label}
                                    onClick={() => send(action.prompt)}
                                    className="rounded-lg border px-3 py-2 text-left text-xs transition-colors hover:bg-gray-50"
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-800'
                                        }`}
                                >
                                    <p className="whitespace-pre-wrap">{msg.content || '...'}</p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="border-t p-3">
                {isStreaming && (
                    <div className="mb-2 flex justify-center">
                        <Button variant="outline" size="sm" onClick={stop}>
                            <StopCircle className="mr-1 h-3 w-3" />
                            Berhenti
                        </Button>
                    </div>
                )}
                <div className="flex gap-2">
                    <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ketik pesan..."
                        rows={1}
                        className="min-h-[40px] max-h-[120px] resize-none"
                        disabled={isStreaming}
                    />
                    <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={!input.trim() || isStreaming}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
