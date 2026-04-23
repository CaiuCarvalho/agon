// @ts-check
const { withSentryConfig } = require('@sentry/nextjs')
const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack(config) {
        config.resolve.alias = {
            ...config.resolve.alias,
            '@': path.resolve(__dirname, 'src'),
        }
        return config
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "res.cloudinary.com",
            },
        ],
    },
    
    /**
     * API Route Timeout Configuration
     * 
     * Next.js default timeout for API routes: 60 seconds (60000ms)
     * This is the maximum time an API route can execute before timing out.
     * 
     * Mercado Pago SDK Timeout: 25 seconds (configured in mercadoPagoService.ts)
     * - Set to 25s to ensure it completes before Next.js timeout
     * - Provides 35s margin for request processing, database operations, and error handling
     * - If Mercado Pago times out, route.ts returns 504 (Gateway Timeout) with clear error message
     * 
     * Client Timeout: 60 seconds (configured in useCheckout.ts)
     * - Matches Next.js timeout to prevent indefinite hangs
     * - Uses AbortSignal to cancel requests that exceed timeout
     * 
     * Timeout Flow:
     * 1. Client sends request with 60s timeout
     * 2. Server processes with 60s Next.js limit
     * 3. Mercado Pago SDK has 25s timeout
     * 4. If Mercado Pago times out → Server returns 504 before Next.js timeout
     * 5. If server times out → Client aborts request and shows error
     * 
     * See: apps/web/src/app/api/checkout/create-order/route.ts (lines 234-251)
     * See: apps/web/src/modules/checkout/hooks/useCheckout.ts
     * See: apps/web/src/modules/payment/services/mercadoPagoService.ts (line 31)
     */
};

// Wrap with Sentry only when DSN is configured (skips overhead in local dev).
module.exports = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT ?? 'agon-web',
      // Upload source maps silently; show errors only in CI.
      silent: !process.env.CI,
      // Include server-side files for better stack traces.
      widenClientFileUpload: true,
      // Proxy Sentry requests through the app to avoid ad-blockers.
      tunnelRoute: '/monitoring-tunnel',
      // Hide source maps from browser devtools in production.
      hideSourceMaps: true,
      disableLogger: true,
      automaticVercelMonitors: false,
    })
  : nextConfig;
