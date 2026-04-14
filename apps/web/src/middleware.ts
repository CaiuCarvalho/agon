import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isAdminRole } from '@/lib/auth/roles'

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const path = request.nextUrl.pathname;
  console.log(`[MW] ${path} - START`);
  
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
    
    const elapsed = Date.now() - startTime;
    console.log(`[MW] ${path} - SESSION_CHECK: ${elapsed}ms, hasSession=${!!session}`);

    const elapsed = Date.now() - startTime;
    console.log(`[MW] ${path} - SESSION_CHECK: ${elapsed}ms, hasSession=${!!session}`);

    // Proteger rotas /admin e /perfil
    if (
      (request.nextUrl.pathname.startsWith('/admin') ||
        request.nextUrl.pathname.startsWith('/perfil')) &&
      !session
    ) {
      console.log(`[MW] ${path} - REDIRECT to /login (no session)`);
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

      const isAdmin = isAdminRole({
        profileRole: profile?.role,
        metadataRole: session.user.user_metadata?.role,
      })

      if (!isAdmin) {
        console.log(`[MW] ${path} - REDIRECT to / (not admin)`);
        return NextResponse.redirect(new URL('/', request.url))
      }
    }

    console.log(`[MW] ${path} - ALLOW: ${Date.now() - startTime}ms`);
    return supabaseResponse
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[MW] ${path} - ERROR after ${elapsed}ms:`, error);

    const isProtectedPath =
      request.nextUrl.pathname.startsWith('/admin') ||
      request.nextUrl.pathname.startsWith('/perfil')

    if (isProtectedPath) {
      console.log(`[MW] ${path} - REDIRECT to /login (error on protected path)`);
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    console.log(`[MW] ${path} - ALLOW (error on public path)`);
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
