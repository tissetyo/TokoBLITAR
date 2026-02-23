import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const profileSchema = z.object({
    full_name: z.string().optional(),
    avatar_url: z.string().optional(),
    phone: z.string().optional(),
    street: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    postal_code: z.string().optional(),
    area_id: z.string().optional(),
})

// PATCH: update user profile
export async function PATCH(request: Request) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const parsed = profileSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json({ error: 'Data tidak valid', details: parsed.error.flatten() }, { status: 400 })
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile, error } = await (supabase as any)
            .from('users')
            .update(parsed.data)
            .eq('id', user.id)
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ profile })
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Terjadi kesalahan'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
