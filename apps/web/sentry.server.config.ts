import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  enabled: !!process.env.SENTRY_DSN,

  // @vercel/otel already set up the global TracerProvider in instrumentation.ts.
  skipOpenTelemetrySetup: true,
})
