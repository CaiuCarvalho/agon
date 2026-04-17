import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isAdminRole } from '@/lib/auth/roles'

function redirectToLogin(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = '/login'
  // request.nextUrl.pathname is a server-internal path (always relative, never
  // user-supplied), so it is safe to pass as the redirect param. The login page
  // currently does NOT read this param — it is kept here for future use.
  redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
  return NextResponse.redirect(redirectUrl)
}

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const path = request.nextUrl.pathname;

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

    // Add timeout to prevent hanging; clean up the timer regardless of outcome.
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const sessionPromise = supabase.auth.getSession()
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Session timeout')), 5000)
    })

    try {
      const result = await Promise.race([sessionPromise, timeoutPromise])
      const { data: { session } } = result

      // Proteger rotas /admin e /perfil
      if (
        (path.startsWith('/admin') || path.startsWith('/perfil')) &&
        !session
      ) {
        return redirectToLogin(request)
      }

      // Proteger /admin apenas para role admin
      if (path.startsWith('/admin') && session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        const isAdmin = isAdminRole({
          profileRole: profile?.role,
          metadataRole: session.user.user_metadata?.role,
        })

        if (!isAdmin) {
          return NextResponse.redirect(new URL('/', request.url))
        }
      }

      return supabaseResponse
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
    }
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[MW] ${path} - ERROR after ${elapsed}ms:`, error);

    const isProtectedPath = path.startsWith('/admin') || path.startsWith('/perfil')

    if (isProtectedPath) {
      return redirectToLogin(request)
    }

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
