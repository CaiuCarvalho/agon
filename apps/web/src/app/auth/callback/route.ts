import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const nextParam = requestUrl.searchParams.get('next') ?? '/'
  // Validate next is a relative path to prevent open redirect attacks.
  // Reject protocol-relative URLs like //evil.com and absolute URLs.
  const safeNext = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(safeNext, requestUrl.origin))
    }
  }

  // Erro na confirmação - redireciona para login com mensagem
  return NextResponse.redirect(
    new URL('/login?error=confirmation_failed', requestUrl.origin)
  )
}
