import { getCityDisplayName, getShowName, getTagline } from "@/lib/branding"
import { getBrandTheme } from "@/lib/brand-theme"
import type { PlatformContext } from "@/lib/platform-config"
import type { WeeklyWindow } from "@/lib/events"

const NAV = [
  { id: "best-of", label: "Best Of" },
  { id: "top-events", label: "Top Events" },
  { id: "upcoming-events", label: "Upcoming" },
  { id: "community-events", label: "Community" },
  { id: "weekly-events", label: "Full Week" },
  { id: "hidden-gems", label: "Hidden Gems" },
  { id: "lake-conditions", label: "Water Temp" },
  { id: "fishing", label: "Fishing" },
  { id: "weekly-video", label: "Video" },
  { id: "sponsors", label: "Sponsors" },
] as const

type SiteHeaderProps = {
  platform: PlatformContext
}

export function SiteHeader({ platform }: SiteHeaderProps) {
  const showName = getShowName(platform.brand)
  const { logoUrl } = getBrandTheme(platform.brand)

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <a className="flex min-w-0 items-center gap-3" href="#/">
            {logoUrl ? (
              <img
                alt=""
                className="h-10 w-10 rounded-full object-cover ring-2 ring-amber-400/30"
                src={logoUrl}
              />
            ) : (
              <span
                aria-hidden
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-sky-500 text-sm font-bold text-white"
              >
                {showName.slice(0, 1)}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-display text-lg leading-tight">{showName}</p>
              <p className="truncate text-xs text-foreground/55">
                {getCityDisplayName(platform.city)}
              </p>
            </div>
          </a>
        </div>

        <nav
          aria-label="Site sections"
          className="mt-3 flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {NAV.map((item) => (
            <a
              className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-foreground/70 transition hover:bg-foreground/5 hover:text-foreground"
              href={`#/${item.id}`}
              key={item.id}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}

export function SiteFooter({ platform }: { platform: PlatformContext }) {
  const showName = getShowName(platform.brand)

  return (
    <footer className="border-t border-border/50 bg-background/80">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center sm:px-6">
        <p className="font-display text-lg">{showName}</p>
        <p className="mt-1 text-sm text-foreground/55">
          {getTagline(platform.brand) || "Weekly destination events guide"}
        </p>
        <p className="mt-4 text-xs text-foreground/45">
          <a className="underline hover:text-foreground/70" href="#/approval">
            Operator dashboard
          </a>
        </p>
      </div>
    </footer>
  )
}

type SiteIntroProps = {
  platform: PlatformContext
  weeklyWindow: WeeklyWindow
  eventCount: number
  usingWeeklyFallback: boolean
}

export function SiteIntro({
  platform,
  weeklyWindow,
  eventCount,
  usingWeeklyFallback,
}: SiteIntroProps) {
  const pageTitle = platform.brand.events_page_title ?? "Weekly Events"
  const tagline = getTagline(platform.brand)
  const cityName = getCityDisplayName(platform.city)

  return (
    <section className="border-b border-border/50 bg-gradient-to-b from-[#f8f2ea] via-[#faf7f2] to-background">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/55">
          {getShowName(platform.brand)}
        </p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl">{pageTitle}</h1>
        {tagline ? (
          <p className="mt-2 max-w-2xl text-lg text-foreground/70">{tagline}</p>
        ) : null}
        <p className="mt-3 text-sm text-foreground/65">
          {usingWeeklyFallback
            ? `All published events — ${cityName}`
            : `Week of ${weeklyWindow.label} — ${cityName}`}
          {" · "}
          {eventCount} events
        </p>
      </div>
    </section>
  )
}
