import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 10 % of traces to stay within free tier even at 10k DAU.
  tracesSampleRate: 0.1,

  // Session replays only when an error occurs (1 replay = 1 event on free tier).
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // Do not send errors in local dev unless DSN is explicitly set.
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Avoid spamming Sentry with noisy browser extension errors.
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    /^Non-Error promise rejection captured/,
  ],
})
