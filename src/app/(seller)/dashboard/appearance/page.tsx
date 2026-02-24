import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StoreAppearanceForm } from '@/components/seller/StoreAppearanceForm'

export default async function StoreAppearancePage() {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: store } = await (supabase as any)
        .from('stores')
        .select('id, name, slug, web_enabled, bio_enabled, theme, font_family, bio_description')
        .eq('user_id', user.id)
        .single()

    if (!store) {
        redirect('/dashboard') // Or some onboarding page
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: links } = await (supabase as any)
        .from('store_links')
        .select('*')
        .eq('store_id', store.id)
        .order('position', { ascending: true })

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Tampilan Toko</h1>
                <p className="text-sm text-slate-500">Sesuaikan desain etalase Web Toko dan Link in Bio publik Anda.</p>
            </div>

            <StoreAppearanceForm store={store} initialLinks={links || []} />
        </div>
    )
}
