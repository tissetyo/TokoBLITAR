'use client'

import { useCallback, useRef } from 'react'
import { useAIStore } from '@/store/aiSessionStore'

export function useAI() {
    const { addMessage, updateMessage, setStreaming } = useAIStore()
    const abortRef = useRef<AbortController | null>(null)

    const send = useCallback(
        async (userMessage: string) => {
            // Add user message
            addMessage({ role: 'user', content: userMessage })

            // Add placeholder assistant message
            const assistantId = addMessage({ role: 'assistant', content: '', isStreaming: true })
            setStreaming(true)

            const controller = new AbortController()
            abortRef.current = controller

            try {
                const res = await fetch('/api/ai/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: useAIStore.getState().messages
                            .filter((m) => !m.isStreaming)
                            .map((m) => ({ role: m.role, content: m.content })),
                    }),
                    signal: controller.signal,
                })

                if (!res.ok) {
                    const err = await res.json().catch(() => ({ error: 'AI error' }))
                    updateMessage(assistantId, err.error || 'Terjadi kesalahan')
                    setStreaming(false)
                    return
                }

                // Read SSE stream
                const reader = res.body?.getReader()
                const decoder = new TextDecoder()
                let accumulated = ''

                if (reader) {
                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break

                        const chunk = decoder.decode(value, { stream: true })
                        const lines = chunk.split('\n')

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const data = line.slice(6)
                                if (data === '[DONE]') continue

                                try {
                                    const parsed = JSON.parse(data)
                                    if (parsed.type === 'text') {
                                        accumulated += parsed.content
                                        updateMessage(assistantId, accumulated)
                                    } else if (parsed.type === 'tool_result') {
                                        accumulated += `\n\n✅ ${parsed.tool}: ${parsed.result}`
                                        updateMessage(assistantId, accumulated)
                                    } else if (parsed.type === 'error') {
                                        accumulated += `\n\n❌ ${parsed.content}`
                                        updateMessage(assistantId, accumulated)
                                    }
                                } catch {
                                    // Skip unparseable lines
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    updateMessage(assistantId, 'Koneksi terputus. Coba lagi.')
                }
            } finally {
                setStreaming(false)
                abortRef.current = null
            }
        },
        [addMessage, updateMessage, setStreaming],
    )

    const stop = useCallback(() => {
        abortRef.current?.abort()
        setStreaming(false)
    }, [setStreaming])

    return { send, stop }
}
