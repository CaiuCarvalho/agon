import { registerOTel } from '@vercel/otel'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'

export async function register() {
  // Set up OpenTelemetry — traces go to Grafana Cloud Tempo when env vars are present.
  // @vercel/otel must initialise BEFORE Sentry so Sentry can hook into the global provider.
  const traceExporter =
    process.env.GRAFANA_OTLP_ENDPOINT && process.env.GRAFANA_OTLP_TOKEN
      ? new OTLPTraceExporter({
          url: `${process.env.GRAFANA_OTLP_ENDPOINT}/v1/traces`,
          headers: {
            Authorization: `Basic ${process.env.GRAFANA_OTLP_TOKEN}`,
          },
        })
      : undefined

  registerOTel({
    serviceName: 'agon-web',
    ...(traceExporter && { traceExporter }),
  })

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export { captureRequestError as onRequestError } from '@sentry/nextjs'
