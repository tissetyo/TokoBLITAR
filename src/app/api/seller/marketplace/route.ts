import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// POST: connect marketplace (store OAuth tokens)
export async function POST(request: Request) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: store } = await (supabase as any)
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single()

    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

    const { platform, auth_code } = await request.json()

    if (!platform || !auth_code) {
        return NextResponse.json({ error: 'platform and auth_code required' }, { status: 400 })
    }

    const validPlatforms = ['tokopedia', 'shopee', 'lazada']
    if (!validPlatforms.includes(platform)) {
        return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
    }

    try {
        // In production: exchange auth_code for access_token via platform OAuth
        // For now, store the code as the token (placeholder)
        const tokenData = {
            access_token: auth_code,
            refresh_token: '',
            expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
        }

        // Upsert marketplace connection
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
            .from('marketplace_connections')
            .upsert({
                store_id: store.id,
                platform,
                access_token_encrypted: JSON.stringify(tokenData), // In prod: encrypt with ENCRYPTION_KEY
                status: 'connected',
                connected_at: new Date().toISOString(),
            }, { onConflict: 'store_id,platform' })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        return NextResponse.json({ connection: data })
    } catch {
        return NextResponse.json({ error: 'Connection failed' }, { status: 500 })
    }
}

// GET: marketplace connection status
export async function GET(request: NextRequest) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: store } = await (supabase as any)
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single()

    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: connections } = await (supabase as any)
        .from('marketplace_connections')
        .select('platform, status, connected_at, last_sync_at')
        .eq('store_id', store.id)

    const platforms = ['tokopedia', 'shopee', 'lazada'].map((platform) => {
        const conn = connections?.find((c: { platform: string }) => c.platform === platform)
        return {
            platform,
            connected: conn?.status === 'connected',
            connected_at: conn?.connected_at || null,
            last_sync_at: conn?.last_sync_at || null,
        }
    })

    return NextResponse.json({ platforms })
}
