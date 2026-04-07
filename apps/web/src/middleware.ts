import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    let supabaseResponse = NextResponse.next({
      request,
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Add timeout to prevent hanging
    const sessionPromise = supabase.auth.getSession()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session timeout')), 5000)
    )

    const {
      data: { session },
    } = await Promise.race([sessionPromise, timeoutPromise]) as any

    // Proteger rotas /admin e /perfil
    if (
      (request.nextUrl.pathname.startsWith('/admin') ||
        request.nextUrl.pathname.startsWith('/perfil')) &&
      !session
    ) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Proteger /admin apenas para role admin
    if (request.nextUrl.pathname.startsWith('/admin') && session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profile?.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }

    return supabaseResponse
  } catch (error) {
    console.error('[Middleware] Error:', error)
    // If middleware fails, allow the request to continue
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/perfil/:path*',
    '/checkout',
    '/pedido/:path*',
  ],
}
