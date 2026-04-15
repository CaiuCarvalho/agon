import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)

    const { error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .abortSignal(controller.signal)

    clearTimeout(timeout)

    if (error) {
      return NextResponse.json(
        { status: 'degraded', supabase: 'error', error: error.message },
        { status: 503 }
      )
    }

    return NextResponse.json({ status: 'ok', supabase: 'ok' })
  } catch (err) {
    return NextResponse.json(
      { status: 'down', error: err instanceof Error ? err.message : 'unknown' },
      { status: 503 }
    )
  }
}
