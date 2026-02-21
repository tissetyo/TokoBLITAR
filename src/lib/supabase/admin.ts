import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: any = null

export function getAdminSupabase() {
    if (client) return client as ReturnType<typeof createClient<Database>>

    client = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    return client as ReturnType<typeof createClient<Database>>
}
