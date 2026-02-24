import { createSupabaseServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Store, Link as LinkIcon, ExternalLink } from 'lucide-react'
import { getTheme, getFont } from '@/lib/themes'

// Map common names to simple icons (Can be expanded)
function getIconForTitle(title: string) {
    const t = title.toLowerCase()
    if (t.includes('shopee')) return 'bag'
    if (t.includes('tokopedia')) return 'bag'
    if (t.includes('tiktok')) return 'video'
    if (t.includes('wa') || t.includes('whatsapp')) return 'message'
    if (t.includes('instagram') || t.includes('ig')) return 'image'
    return 'link'
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createSupabaseServerClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: store } = await (supabase as any)
        .from('stores')
        .select('name, bio_description')
        .eq('slug', slug)
        .single()

    if (!store) return { title: 'Link in Bio Tidak Ditemukan' }
    return {
        title: `${store.name} | Links`,
        description: store.bio_description || `Daftar tautan resmi dari ${store.name}`,
    }
}

export default async function BioPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createSupabaseServerClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: store } = await (supabase as any)
        .from('stores')
        .select('id, name, logo_url, bio_enabled, theme, font_family, bio_description')
        .eq('slug', slug)
        .single()

    if (!store) return notFound()

    if (!store.bio_enabled) {
        return (
            <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <Store className="h-16 w-16 text-slate-300 mb-4" />
                <h1 className="text-2xl font-bold text-slate-800">Link-in-Bio Tidak Aktif</h1>
                <p className="mt-2 text-slate-500 max-w-sm">Toko {store.name} mematikan halaman daftar tautannya.</p>
            </main>
        )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: links } = await (supabase as any)
        .from('store_links')
        .select('id, title, url')
        .eq('store_id', store.id)
        .eq('is_active', true)
        .order('position', { ascending: true })

    const theme = getTheme(store.theme)
    const font = getFont(store.font_family)

    return (
        <main
            className={`min-h-screen w-full flex flex-col items-center px-4 py-16 transition-colors ${theme.background} ${font.fontClass}`}
        >
            <div className="w-full max-w-md mx-auto flex flex-col items-center space-y-6">

                {/* Profile Avatar */}
                <div
                    className="h-24 w-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg border-4 border-white/50 backdrop-blur-sm"
                    style={{ backgroundColor: theme.primaryColor }}
                >
                    {store.logo_url ? (
                        <img src={store.logo_url} alt={store.name} className="h-full w-full rounded-full object-cover" />
                    ) : (
                        store.name.charAt(0).toUpperCase()
                    )}
                </div>

                {/* Header Info */}
                <div className="text-center space-y-2">
                    <h1 className={`text-2xl font-bold ${theme.textColor}`}>{store.name}</h1>
                    {store.bio_description && (
                        <p className={`text-base font-medium px-4 ${theme.secondaryTextColor}`}>
                            {store.bio_description}
                        </p>
                    )}
                </div>

                {/* Links Container */}
                <div className="w-full flex justify-center pt-4">
                    <div className="w-full space-y-4">
                        {links && links.length > 0 ? (
                            links.map((link: { id: string; title: string; url: string }) => {
                                const url = link.url.startsWith('http') ? link.url : `https://${link.url}`
                                return (
                                    <a
                                        key={link.id}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`group relative flex w-full items-center justify-between rounded-xl p-4 text-center transition-all ${theme.cardBg} ${theme.textColor}`}
                                    >
                                        <div className="absolute left-4 opacity-70 group-hover:opacity-100 transition-opacity">
                                            <LinkIcon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 text-base font-bold text-slate-800">
                                            {link.title}
                                        </div>
                                        <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                                            <ExternalLink className="h-4 w-4" />
                                        </div>
                                    </a>
                                )
                            })
                        ) : (
                            <p className="text-center text-slate-400 text-sm py-4">Belum ada tautan ditambahkan.</p>
                        )}
                    </div>
                </div>

                {/* Footer Branding */}
                <div className="mt-12 opacity-50 text-center">
                    <a href="/" className={`text-xs font-bold tracking-wider ${theme.textColor}`}>
                        Powered by TokoBLITAR
                    </a>
                </div>

            </div>
        </main>
    )
}
