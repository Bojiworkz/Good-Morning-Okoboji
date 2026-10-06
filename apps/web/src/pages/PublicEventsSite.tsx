import { useEffect, useMemo, useState } from "react"
import { EventCard } from "@/components/EventCard"
import { CategoryChips } from "@/components/site/CategoryChips"
import { extractEventCategories } from "@/lib/event-categories"
import { EventSection, PlaceholderSection } from "@/components/site/EventSection"
import { TopEventsByDay } from "@/components/site/TopEventsByDay"
import { SiteFooter, SiteHeader, SiteIntro } from "@/components/site/SiteHeader"
import { SponsorStrip } from "@/components/site/SponsorStrip"
import { LakeConditionsSection, FishingVideoSection } from "@/components/site/LakeAndFishingSection"
import { getCityDisplayName, getShowName, getTagline } from "@/lib/branding"
import { partitionEventsForSite } from "@/lib/event-sections"
import {
  filterWeeklyEvents,
  getWeeklyWindow,
  getCalendarDate,
  sortEvents,
  type EventItem,
} from "@/lib/events"
import type { PlatformContext } from "@/lib/platform-config"
import { WeeklyVideoSection } from "@/components/site/WeeklyVideoSection"
import { setPageMeta } from "@/lib/site-meta"
import { getFishingVideoUrl } from "@/lib/water-data"

type PublicEventsSiteProps = {
  platform: PlatformContext
  events: EventItem[]
  initialSection?: string | null
}

/**
 * Public weekly events site at #/ — per GMO_OPERATIONAL_ROADMAP and
 * ARCHITECTURE_REVIEW.md Phase 2 website sections.
 */
export function PublicEventsSite({
  platform,
  events,
  initialSection,
}: PublicEventsSiteProps) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string | null>(null)

  const weeklyWindow = useMemo(
    () =>
      getWeeklyWindow(
        new Date(),
        platform.brand.week_window_start_dow ?? 4,
        platform.brand.week_window_days ?? 7
      ),
    [platform.brand.week_window_start_dow, platform.brand.week_window_days]
  )

  const weeklyEvents = useMemo(
    () => filterWeeklyEvents(events, weeklyWindow),
    [events, weeklyWindow]
  )

  const usingWeeklyFallback = false
  const today = getCalendarDate(new Date(), platform.city.timezone || "America/Chicago")
  const displayEvents = weeklyEvents.filter((event) => event.event_date >= today)
  const topLimit = platform.brand.top_events_limit ?? 8

  const sections = useMemo(
    () => partitionEventsForSite(displayEvents, topLimit),
    [displayEvents, topLimit]
  )

  const categories = useMemo(
    () => extractEventCategories(displayEvents),
    [displayEvents]
  )

  const filteredWeekly = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return sections.weeklyEvents.filter((event) => {
      if (category && event.category?.trim() !== category) return false
      if (!normalizedQuery) return true
      const haystack = [
        event.title,
        event.description,
        event.location_name,
        event.location_address,
        event.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [sections.weeklyEvents, query, category])

  const showName = getShowName(platform.brand)
  const cityName = getCityDisplayName(platform.city)
  const pageTitle = platform.brand.events_page_title ?? "Weekly Events"
  const fishingVideoUrl = useMemo(() => getFishingVideoUrl(platform), [platform])

  useEffect(() => {
    setPageMeta({
      title: `${showName} — ${pageTitle}`,
      description:
        getTagline(platform.brand) ||
        `Top events, upcoming calendar, and community listings for ${cityName}.`,
    })
  }, [showName, pageTitle, cityName, platform.brand])

  useEffect(() => {
    if (!initialSection) return
    const el = document.getElementById(initialSection)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [initialSection, displayEvents.length])

  return (
    <div className="min-h-svh bg-gradient-to-b from-[#f8f2ea] via-[#faf7f2] to-[#eef4fb] text-foreground">
      <SiteHeader platform={platform} />
      <SiteIntro
        eventCount={displayEvents.length}
        platform={platform}
        usingWeeklyFallback={usingWeeklyFallback}
        weeklyWindow={weeklyWindow}
      />

      <main className="mx-auto max-w-6xl space-y-14 px-4 py-10 sm:px-6">
        {usingWeeklyFallback ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground/80">
            No events in the configured weekly window. Showing all published events
            until ingestion updates current dates.
          </p>
        ) : null}

        <TopEventsByDay
          days={sections.topEventsByDay}
          description="Current highlights selected for audience appeal: headline entertainment, signature events, and standout local experiences."
          emptyMessage="No verified audience-interest highlights meet the selection criteria yet. Browse current local listings below."
          id="top-events"
          title={platform.brand.top_events_section_title ?? "Top Events This Week"}
        />

        <EventSection
          description="Current and upcoming approved events, ordered by date."
          events={sortEvents(events.filter((event) => event.event_date >= today)).sort((a, b) => a.event_date.localeCompare(b.event_date))}
          id="upcoming-events"
          title="Upcoming Events"
        />

        <EventSection
          description="Meetups, clubs, and community gatherings."
          emptyMessage="No community-class events this week."
          events={sections.communityEvents}
          id="community-events"
          title="Community Events"
        />

        <section className="scroll-mt-24" id="weekly-events">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="font-display text-2xl">
                {platform.brand.weekly_events_section_title ?? "Weekly Events"}
              </h2>
              <p className="mt-1 text-sm text-foreground/65">
                Explore the remaining events this week. Search and
                filter below.
              </p>
            </div>
            <div className="flex w-full max-w-md items-center rounded-xl border border-border/70 bg-background px-3 py-2 shadow-sm lg:w-72">
              <input
                aria-label="Search events"
                className="w-full bg-transparent text-sm placeholder:text-foreground/45"
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search events…"
                type="search"
                value={query}
              />
            </div>
          </div>
          <CategoryChips
            categories={categories}
            onSelect={setCategory}
            selected={category}
          />
          <div className="mt-6">
            {filteredWeekly.length === 0 ? (
              <p className="text-sm text-foreground/60">No events match your filters.</p>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredWeekly.map((event) => (
                  <EventCard event={event} key={event.id} />
                ))}
              </div>
            )}
          </div>
        </section>

        {sections.familyEvents.length > 0 ? (
          <EventSection
            description="Activities for families and younger visitors."
            events={sections.familyEvents}
            id="family-activities"
            title="Family Activities"
          />
        ) : (
          <PlaceholderSection
            description="Find something to enjoy together."
            id="family-activities"
            status="No verified family events are listed for the rest of this week."
            title="Family Activities"
          />
        )}

        <PlaceholderSection
          description="Discover more of the Iowa Great Lakes."
          id="hidden-gems"
          status="Our local recommendations are being researched. Check back for verified places to explore."
          title="Hidden Gems"
        />
      </main>

      <LakeConditionsSection platform={platform} />

      <FishingVideoSection fishingVideoUrl={fishingVideoUrl} platform={platform} />

      <WeeklyVideoSection platform={platform} />

      <SponsorStrip platform={platform} />

      <SiteFooter platform={platform} />
    </div>
  )
}
