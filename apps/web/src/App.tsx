import { BestOfPage } from "@/pages/BestOfPage"
import { ApprovalDashboard } from "@/components/ApprovalDashboard"
import { usePlatformData } from "@/hooks/usePlatformData"
import { PublicEventsSite } from "@/pages/PublicEventsSite"
import { useEffect, useState } from "react"

function useHashRoute() {
  const [route, setRoute] = useState(
    () => window.location.hash.replace(/^#/, "") || "/"
  )

  useEffect(() => {
    const onHash = () =>
      setRoute(window.location.hash.replace(/^#/, "") || "/")
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])

  return route
}

function LoadingScreen() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background text-foreground/70">
      Loading platform configuration and events…
    </div>
  )
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <div
        className="max-w-lg rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive"
        role="alert"
      >
        {message}
      </div>
    </div>
  )
}

/** Section anchor routes: #/top-events, #/weekly-events, etc. */
function parseSectionRoute(route: string): string | null {
  if (route === "/" || route.startsWith("/approval")) return null
  const section = route.replace(/^\//, "")
  return section || null
}

export function App() {
  const route = useHashRoute()
  const { platform, events, loading, error } = usePlatformData()

  if (route.startsWith("/approval")) {
    return <ApprovalDashboard />
  }

  if (loading) return <LoadingScreen />
  if (error || !platform) return <ErrorScreen message={error ?? "Failed to load."} />

  if (route === "/best-of") return <BestOfPage platform={platform} />

  return (
    <PublicEventsSite
      events={events}
      initialSection={parseSectionRoute(route)}
      platform={platform}
    />
  )
}
