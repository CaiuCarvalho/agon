import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Singleton instance to prevent multiple clients
let client: SupabaseClient | null = null

export function createClient() {
  // Return existing client if already created
  if (client) {
    return client
  }
  
  // Create new client only if it doesn't exist
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  return client
}
