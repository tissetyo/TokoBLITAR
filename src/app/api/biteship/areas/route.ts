import { NextResponse, type NextRequest } from 'next/server'
import { getBiteshipAreas } from '@/lib/biteship'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const input = request.nextUrl.searchParams.get('input')

    if (!input || input.length < 3) {
        return NextResponse.json({ areas: [] })
    }

    try {
        const areas = await getBiteshipAreas(input)
        return NextResponse.json({ areas })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Gagal mencari area'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
