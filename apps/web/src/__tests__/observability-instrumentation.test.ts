import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Stable mock references available inside vi.mock factories
const { mockRegisterOTel, MockOTLPTraceExporter, mockSentryInit, mockCaptureRequestError } = vi.hoisted(() => {
  const mockRegisterOTel = vi.fn()
  // Must be a real function (not arrow) so `new OTLPTraceExporter()` works as a constructor call.
  // eslint-disable-next-line prefer-arrow-callback
  const MockOTLPTraceExporter = vi.fn(function MockOTLPTraceExporter(this: unknown) { return this })
  const mockSentryInit = vi.fn()
  const mockCaptureRequestError = vi.fn()
  return { mockRegisterOTel, MockOTLPTraceExporter, mockSentryInit, mockCaptureRequestError }
})

vi.mock('@vercel/otel', () => ({ registerOTel: mockRegisterOTel }))
vi.mock('@opentelemetry/exporter-trace-otlp-http', () => ({ OTLPTraceExporter: MockOTLPTraceExporter }))
vi.mock('@sentry/nextjs', () => ({
  init: mockSentryInit,
  captureRequestError: mockCaptureRequestError,
}))

const originalEnv = process.env

describe('instrumentation.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  describe('register()', () => {
    it('calls registerOTel with serviceName agon-web', async () => {
      const { register } = await import('../../instrumentation')
      await register()
      expect(mockRegisterOTel).toHaveBeenCalledOnce()
      expect(mockRegisterOTel).toHaveBeenCalledWith(
        expect.objectContaining({ serviceName: 'agon-web' })
      )
    })

    it('does NOT create OTLPTraceExporter when GRAFANA_OTLP_ENDPOINT is unset', async () => {
      delete process.env.GRAFANA_OTLP_ENDPOINT
      delete process.env.GRAFANA_OTLP_TOKEN
      const { register } = await import('../../instrumentation')
      await register()
      expect(MockOTLPTraceExporter).not.toHaveBeenCalled()
    })

    it('does NOT create OTLPTraceExporter when only GRAFANA_OTLP_TOKEN is set (both required)', async () => {
      delete process.env.GRAFANA_OTLP_ENDPOINT
      process.env.GRAFANA_OTLP_TOKEN = 'token-only'
      const { register } = await import('../../instrumentation')
      await register()
      expect(MockOTLPTraceExporter).not.toHaveBeenCalled()
    })

    it('creates OTLPTraceExporter with correct URL when both Grafana vars are set', async () => {
      process.env.GRAFANA_OTLP_ENDPOINT = 'https://otlp.grafana.net/otlp'
      process.env.GRAFANA_OTLP_TOKEN = 'aW5zdGFuY2VJZDphcGlUb2tlbg=='
      const { register } = await import('../../instrumentation')
      await register()
      expect(MockOTLPTraceExporter).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://otlp.grafana.net/otlp/v1/traces',
        })
      )
    })

    it('passes Authorization header with Grafana token to OTLPTraceExporter', async () => {
      const token = 'aW5zdGFuY2VJZDphcGlUb2tlbg=='
      process.env.GRAFANA_OTLP_ENDPOINT = 'https://otlp.grafana.net/otlp'
      process.env.GRAFANA_OTLP_TOKEN = token
      const { register } = await import('../../instrumentation')
      await register()
      expect(MockOTLPTraceExporter).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: `Basic ${token}` }),
        })
      )
    })

    it('passes traceExporter to registerOTel when Grafana vars are set', async () => {
      process.env.GRAFANA_OTLP_ENDPOINT = 'https://otlp.grafana.net/otlp'
      process.env.GRAFANA_OTLP_TOKEN = 'tok'
      const { register } = await import('../../instrumentation')
      await register()
      const call = mockRegisterOTel.mock.calls[0][0]
      expect(call.traceExporter).toBeDefined()
    })

    it('does NOT pass traceExporter to registerOTel when Grafana vars are unset', async () => {
      delete process.env.GRAFANA_OTLP_ENDPOINT
      delete process.env.GRAFANA_OTLP_TOKEN
      const { register } = await import('../../instrumentation')
      await register()
      const call = mockRegisterOTel.mock.calls[0][0]
      expect(call.traceExporter).toBeUndefined()
    })

    it('imports sentry.server.config when NEXT_RUNTIME is nodejs', async () => {
      process.env.NEXT_RUNTIME = 'nodejs'
      const { register } = await import('../../instrumentation')
      await register()
      // Sentry.init is called from sentry.server.config which imports @sentry/nextjs (mocked)
      expect(mockSentryInit).toHaveBeenCalledOnce()
    })

    it('does NOT import sentry server config when NEXT_RUNTIME is edge', async () => {
      process.env.NEXT_RUNTIME = 'edge'
      const { register } = await import('../../instrumentation')
      await register()
      // sentry.edge.config calls Sentry.init, sentry.server.config does not run
      expect(mockSentryInit).toHaveBeenCalledOnce()
    })

    it('does NOT call Sentry.init when NEXT_RUNTIME is unset', async () => {
      delete process.env.NEXT_RUNTIME
      const { register } = await import('../../instrumentation')
      await register()
      expect(mockSentryInit).not.toHaveBeenCalled()
    })
  })

  describe('onRequestError export', () => {
    it('exports onRequestError as a function', async () => {
      const mod = await import('../../instrumentation')
      expect(typeof mod.onRequestError).toBe('function')
    })

    it('is the same reference as captureRequestError from @sentry/nextjs', async () => {
      const mod = await import('../../instrumentation')
      expect(mod.onRequestError).toBe(mockCaptureRequestError)
    })
  })
})
