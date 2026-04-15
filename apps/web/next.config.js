/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            // Supabase Storage (qualquer projeto — cobre migração de região)
            {
                protocol: "https",
                hostname: "*.supabase.co",
                pathname: "/storage/v1/object/public/**",
            },
            // Cloudinary (manter enquanto houver imagens legadas)
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

module.exports = nextConfig;
