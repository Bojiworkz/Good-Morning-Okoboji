import { useEffect, useState } from "react"
import { fetchEventsForBrand, type EventItem } from "@/lib/events"
import { fetchPlatformContext, type PlatformContext } from "@/lib/platform-config"

export type PlatformDataState = {
  platform: PlatformContext | null
  events: EventItem[]
  loading: boolean
  error: string | null
  reload: () => void
}

export function usePlatformData(): PlatformDataState {
  const [platform, setPlatform] = useState<PlatformContext | null>(null)
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const ctx = await fetchPlatformContext()
        const data = await fetchEventsForBrand(ctx.city, ctx.brand)
        if (!cancelled) {
          setPlatform(ctx)
          setEvents(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load platform data."
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [reloadToken])

  return {
    platform,
    events,
    loading,
    error,
    reload: () => setReloadToken((n) => n + 1),
  }
}
