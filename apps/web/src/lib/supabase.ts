export function getSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

  if (!url?.trim() || !anonKey?.trim()) {
    throw new Error(
      "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env"
    )
  }

  return {
    url: url.replace(/\/$/, ""),
    anonKey: anonKey.trim(),
  }
}
