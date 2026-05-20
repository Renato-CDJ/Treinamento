import { createBrowserClient } from "@supabase/ssr"

// Singleton instance for client-side
let clientInstance: ReturnType<typeof createBrowserClient> | null = null

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export function createClient() {
  if (clientInstance) {
    return clientInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return null instead of throwing - allows app to work without Supabase
    return null
  }

  clientInstance = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )

  return clientInstance
}

// Re-export types for convenience
export type SupabaseClient = ReturnType<typeof createBrowserClient>
