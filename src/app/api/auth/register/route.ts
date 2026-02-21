import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminSupabase } from '@/lib/supabase/admin'

const registerSchema = z.object({
    full_name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['buyer', 'seller']),
})

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const parsed = registerSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Data tidak valid', details: parsed.error.flatten() },
                { status: 400 },
            )
        }

        const { full_name, email, password, role } = parsed.data

        // Create auth user via admin client
        const { data: authData, error: authError } = await getAdminSupabase().auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm for now; switch to false for production
            user_metadata: { full_name },
        })

        if (authError) {
            return NextResponse.json(
                { error: authError.message },
                { status: 400 },
            )
        }

        // Update the role in public.users (trigger creates the row with default 'buyer')
        if (authData.user) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (getAdminSupabase() as any)
                .from('users')
                .update({ role, full_name })
                .eq('id', authData.user.id)
        }

        return NextResponse.json({ message: 'Berhasil mendaftar' }, { status: 201 })
    } catch {
        return NextResponse.json(
            { error: 'Terjadi kesalahan server' },
            { status: 500 },
        )
    }
}
