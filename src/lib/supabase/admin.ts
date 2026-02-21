import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// WARNING: Service role key bypasses RLS.
// Use ONLY in server routes, NEVER in client components.
export const adminSupabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
)
