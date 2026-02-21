import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        // If env vars are not set, just pass through
        return supabaseResponse
    }

    try {

        const supabase = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value }) =>
                            request.cookies.set(name, value),
                        )
                        supabaseResponse = NextResponse.next({
                            request,
                        })
                        cookiesToSet.forEach(({ name, value, options }) =>
                            supabaseResponse.cookies.set(name, value, options),
                        )
                    },
                },
            },
        )

        // Refresh session — important for Server Components
        const {
            data: { user },
        } = await supabase.auth.getUser()

        const pathname = request.nextUrl.pathname

        // Public routes that don't need auth
        const publicRoutes = ['/', '/login', '/register', '/products', '/store']
        const isPublicRoute = publicRoutes.some(
            (route) => pathname === route || pathname.startsWith('/store/') || pathname.startsWith('/products/'),
        )
        const isApiRoute = pathname.startsWith('/api/')
        const isAuthCallback = pathname.startsWith('/auth/')

        // Allow public routes, API routes, and auth callbacks
        if (isPublicRoute || isApiRoute || isAuthCallback) {
            return supabaseResponse
        }

        // Not logged in → redirect to login
        if (!user) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            url.searchParams.set('redirect', pathname)
            return NextResponse.redirect(url)
        }

        // Fetch user role from our users table
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = profile?.role || 'buyer'

        // Protect /dashboard/* → sellers only
        if (pathname.startsWith('/dashboard') && role !== 'seller' && role !== 'admin') {
            const url = request.nextUrl.clone()
            url.pathname = '/'
            return NextResponse.redirect(url)
        }

        // Protect /admin/* → admins only
        if (pathname.startsWith('/admin') && role !== 'admin') {
            const url = request.nextUrl.clone()
            url.pathname = '/'
            return NextResponse.redirect(url)
        }

        // Redirect logged-in users away from auth pages
        if (pathname === '/login' || pathname === '/register') {
            const url = request.nextUrl.clone()
            url.pathname = role === 'seller' ? '/dashboard' : role === 'admin' ? '/admin/dashboard' : '/'
            return NextResponse.redirect(url)
        }

        return supabaseResponse
    } catch {
        // If middleware fails, just pass through instead of crashing the entire site
        return NextResponse.next({ request })
    }
}
