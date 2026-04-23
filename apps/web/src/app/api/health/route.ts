import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const dbStart = Date.now()

  try {
    const supabase = await createClient()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)

    const { error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .abortSignal(controller.signal)

    clearTimeout(timeout)
    const dbLatencyMs = Date.now() - dbStart

    const mem = process.memoryUsage()

    if (error) {
      return NextResponse.json(
        {
          status: 'degraded',
          database: { status: 'error', latencyMs: dbLatencyMs, error: error.message },
          memory: {
            heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
            heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
          },
          uptime: Math.round(process.uptime()),
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      status: 'ok',
      database: { status: 'ok', latencyMs: dbLatencyMs },
      memory: {
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
      },
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    const dbLatencyMs = Date.now() - dbStart
    const mem = process.memoryUsage()

    return NextResponse.json(
      {
        status: 'down',
        database: { status: 'error', latencyMs: dbLatencyMs, error: err instanceof Error ? err.message : 'unknown' },
        memory: {
          heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
        },
        uptime: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
