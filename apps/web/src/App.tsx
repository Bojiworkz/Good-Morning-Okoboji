import {
  CalendarDays,
  ExternalLink,
  LoaderCircle,
  MapPin,
  Menu,
  Search,
  Sparkles,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

type EventItem = {
  id: string
  city_id: string
  source_id: string
  publish_batch_id: string | null
  title: string
  slug: string
  description: string | null
  event_date: string
  event_time_start: string | null
  event_time_end: string | null
  is_recurring: boolean
  location_name: string | null
  location_address: string | null
  category: string | null
  image_url: string | null
  event_url: string | null
  dedup_key: string | null
  rank_score: number | null
  is_published: boolean
  auto_published: boolean
  client_notes: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
  status: string | null
}

const EVENTS_ENDPOINT = import.meta.env.VITE_EVENTS_ENDPOINT;
const API_KEY = import.meta.env.VITE_API_KEY;
const AUTH_TOKEN = API_KEY ||  import.meta.env.VITE_AUTH_TOKEN;


function decodeHtmlEntities(text: string | null) {
  if (!text) {
    return ""
  }
  const doc = new DOMParser().parseFromString(text, "text/html")
  return doc.documentElement.textContent || text
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    return dateString
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

function formatDateShort(dateString: string) {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    return dateString
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date)
}

function formatDateTime(dateTimeString: string | null) {
  if (!dateTimeString) {
    return "Not set"
  }

  const date = new Date(dateTimeString)
  if (Number.isNaN(date.getTime())) {
    return dateTimeString
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}


function formatTimeRange(start: string | null, end: string | null) {
  if (!start && !end) {
    return "TBA"
  }

  const formatSingle = (timeValue: string | null) => {
    if (!timeValue) return null

    const [hours, minutes] = timeValue.split(":")
    const date = new Date()
    date.setHours(Number(hours), Number(minutes), 0, 0)

    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date)
  }

  const startTime = formatSingle(start)
  const endTime = formatSingle(end)

  if (startTime && endTime) {
    return `${startTime} - ${endTime}`
  }

  return startTime ?? endTime ?? "TBA"
}

function getTimeSortValue(timeValue: string | null) {
  if (!timeValue) {
    return Number.POSITIVE_INFINITY
  }

  const [hours, minutes] = timeValue.split(":")
  return Number(hours) * 60 + Number(minutes)
}

function getHostname(urlValue: string | null) {
  if (!urlValue) {
    return null
  }

  try {
    return new URL(urlValue).hostname.replace("www.", "")
  } catch {
    return urlValue
  }
}

export function App() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [showWithImagesOnly, setShowWithImagesOnly] = useState(false)

  const stats = useMemo(() => {
    const recurring = events.filter((event) => event.is_recurring).length
    const withImages = events.filter((event) => Boolean(event.image_url)).length
    const locations = new Set(
      events.map((event) => event.location_name).filter(Boolean)
    ).size
    const days = new Set(
      events.map((event) => event.event_date).filter(Boolean)
    ).size

    return {
      total: events.length,
      recurring,
      locations,
      days,
      withImages,
    }
  }, [events])

  const topLocations = useMemo(() => {
    const counts: Record<string, number> = {}

    events.forEach((event) => {
      if (!event.location_name) {
        return
      }
      counts[event.location_name] = (counts[event.location_name] ?? 0) + 1
    })

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
  }, [events])

  const lastUpdatedLabel = useMemo(() => {
    const timestamps = events
      .map((event) => event.updated_at)
      .filter(Boolean)
      .map((value) => new Date(value).getTime())
      .filter((value) => !Number.isNaN(value))

    if (timestamps.length === 0) {
      return null
    }

    return formatDateTime(new Date(Math.max(...timestamps)).toISOString())
  }, [events])

  const dateRangeLabel = useMemo(() => {
    const dates = events
      .map((event) => new Date(event.event_date))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())

    if (dates.length === 0) {
      return "No dates yet"
    }

    const start = dates[0]
    const end = dates[dates.length - 1]
    const longFormat = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    const shortFormat = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    })

    if (start.toDateString() === end.toDateString()) {
      return longFormat.format(start)
    }

    if (start.getFullYear() === end.getFullYear()) {
      return `${shortFormat.format(start)} - ${longFormat.format(end)}`
    }

    return `${longFormat.format(start)} - ${longFormat.format(end)}`
  }, [events])

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return events.filter((event) => {
      if (showWithImagesOnly && !event.image_url) {
        return false
      }
      if (!normalizedQuery) {
        return true
      }

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
  }, [events, query, showWithImagesOnly])

  const featuredEvents = useMemo(() => {
    return [...filteredEvents]
      .sort((a, b) => {
        const scoreDiff = (b.rank_score ?? 0) - (a.rank_score ?? 0)
        if (scoreDiff !== 0) {
          return scoreDiff
        }
        const dateDiff =
          new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
        if (dateDiff !== 0) {
          return dateDiff
        }
        return a.title.localeCompare(b.title)
      })
      .slice(0, 3)
  }, [filteredEvents])

  const groupedEvents = useMemo(() => {
    const groups: Record<string, EventItem[]> = {}

    filteredEvents.forEach((event) => {
      const dateKey = event.event_date || "Unknown"
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(event)
    })

    Object.keys(groups).forEach((dateKey) => {
      groups[dateKey].sort((a, b) => {
        const timeDiff =
          getTimeSortValue(a.event_time_start) -
          getTimeSortValue(b.event_time_start)
        if (timeDiff !== 0) {
          return timeDiff
        }
        return a.title.localeCompare(b.title)
      })
    })

    return Object.keys(groups)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map((dateKey) => ({
        date: dateKey,
        events: groups[dateKey],
      }))
  }, [filteredEvents])

  const filteredImageCount = useMemo(() => {
    return filteredEvents.filter((event) => Boolean(event.image_url)).length
  }, [filteredEvents])

  const badgeBase =
    "inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-foreground shadow-sm"
  const tagBase =
    "inline-flex items-center rounded-full border border-border/60 bg-muted/60 px-3 py-1 text-xs font-medium text-foreground"
  const imageBadgeBase =
    "inline-flex items-center rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-foreground shadow dark:bg-black/60 dark:text-white"

  useEffect(() => {
    const controller = new AbortController()

    const fetchEvents = async () => {
      try {
        const response = await fetch(EVENTS_ENDPOINT, {
          method: "POST",
          headers: {
            apikey: API_KEY,
            Authorization: `Bearer ${AUTH_TOKEN}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const data = (await response.json()) as EventItem[]
        const cleanedData = data.map((event) => ({
          ...event,
          title: decodeHtmlEntities(event.title),
          description: event.description
            ? decodeHtmlEntities(event.description)
            : null,
          location_name: event.location_name
            ? decodeHtmlEntities(event.location_name)
            : null,
          location_address: event.location_address
            ? decodeHtmlEntities(event.location_address)
            : null,
        }))

        if (!controller.signal.aborted) {
          setEvents(cleanedData)
        }
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return
        }

        const message =
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to load events data."
        setError(message)
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void fetchEvents()

    return () => controller.abort()
  }, [])

  return (
    <div className="relative min-h-svh overflow-hidden bg-gradient-to-b from-[#f8f2ea] via-[#f9f6f1] to-[#eef6ff] text-foreground dark:from-[#0e1117] dark:via-[#111827] dark:to-[#0a0f16]">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-[-15%] h-80 w-80 rounded-full bg-[#f3c8a9]/60 blur-3xl dark:bg-[#1f2a3d]/60"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-10 h-96 w-96 rounded-full bg-[#b7d9ff]/60 blur-3xl dark:bg-[#1c3754]/60"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-25%] left-[30%] h-96 w-96 rounded-full bg-[#b7f0d0]/40 blur-3xl dark:bg-[#1d3a2b]/50"
      />

      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="hover:bg-muted inline-flex size-10 items-center justify-center rounded-xl border md:hidden"
              onClick={() => setIsSidebarOpen((current) => !current)}
              type="button"
            >
              <Menu className="size-5" />
            </button>
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-foreground/70">
                  Weekly events
                </p>
                <p className="font-display text-lg">Okoboji Event Atlas</p>
              </div>
            </div>
          </div>
          <div className="hidden items-center gap-3 text-sm text-foreground/70 md:flex">
            <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs uppercase tracking-wider">
              {dateRangeLabel}
            </span>
            {lastUpdatedLabel ? (
              <span className="text-xs">Updated {lastUpdatedLabel}</span>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <section className="pb-8 pt-10">
          <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-1 text-xs uppercase tracking-[0.2em] text-foreground/70">
                <Sparkles className="size-3" />
                Weekly digest
              </div>
              <div className="space-y-4">
                <h1 className="font-display text-4xl leading-tight sm:text-5xl">
                  Events worth showing up for.
                </h1>
                <p className="max-w-xl text-lg text-foreground/70">
                  A curated view of the latest listings with images, times,
                  locations, and links so you can plan the week in one place.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <span className={badgeBase}>Date range: {dateRangeLabel}</span>
                <span className={badgeBase}>Total events: {stats.total}</span>
                <span className={badgeBase}>Days covered: {stats.days}</span>
              </div>
              {featuredEvents.length ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {featuredEvents.map((event) => (
                    <div
                      className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-background/70 p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                      key={event.id}
                    >
                      <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-muted">
                        {event.image_url ? (
                          <img
                            alt={event.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            src={event.image_url}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-foreground/60">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-semibold leading-snug">
                          {event.title}
                        </p>
                        <p className="text-xs text-foreground/60">
                          {formatDateShort(event.event_date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="rounded-3xl border border-border/60 bg-card/90 p-6 shadow-xl backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-foreground/70">
                    This week
                  </p>
                  <p className="font-display mt-3 text-3xl">{stats.total}</p>
                  <p className="text-sm text-foreground/60">
                    events in the feed
                  </p>
                </div>
                {lastUpdatedLabel ? (
                  <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs text-foreground/70">
                    Updated {lastUpdatedLabel}
                  </span>
                ) : null}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-muted/50 p-4">
                  <p className="text-xs text-foreground/70">Image ready</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {stats.withImages}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/50 p-4">
                  <p className="text-xs text-foreground/70">Recurring</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {stats.recurring}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/50 p-4">
                  <p className="text-xs text-foreground/70">Locations</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {stats.locations}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/50 p-4">
                  <p className="text-xs text-foreground/70">Days covered</p>
                  <p className="mt-2 text-2xl font-semibold">{stats.days}</p>
                </div>
              </div>
              <div className="mt-6 rounded-2xl border border-border/60 bg-background/70 p-4">
                <p className="text-xs uppercase tracking-widest text-foreground/70">
                  Top locations
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  {topLocations.length ? (
                    topLocations.map(([location, count]) => (
                      <div
                        className="flex items-center justify-between gap-3"
                        key={location}
                      >
                        <span className="line-clamp-1">{location}</span>
                        <span className="text-foreground/70">{count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-foreground/60">No locations yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside
            className={`fixed left-0 top-16 z-20 h-[calc(100svh-4rem)] w-[280px] overflow-y-auto border-r border-border/60 bg-card/90 p-6 shadow-xl backdrop-blur transition-transform lg:static lg:h-auto lg:translate-x-0 lg:rounded-3xl lg:border ${
              isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-foreground/70">
                  Search
                </p>
                <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border/70 bg-background/80 px-3 py-2 shadow-sm">
                  <Search className="size-4 text-foreground/60" />
                  <input
                    className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/50"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search title, location, category"
                    type="text"
                    value={query}
                  />
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-foreground/70">
                  Filters
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    aria-pressed={showWithImagesOnly}
                    className={`${
                      showWithImagesOnly
                        ? "bg-foreground text-background"
                        : "bg-muted/70 text-foreground"
                    } rounded-full px-4 py-2 text-xs font-medium shadow-sm transition`}
                    onClick={() => setShowWithImagesOnly((value) => !value)}
                    type="button"
                  >
                    With images
                  </button>
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 text-sm">
                <p className="font-semibold text-foreground">Quick stats</p>
                <div className="mt-3 space-y-2 text-xs text-foreground/70">
                  <div className="flex items-center justify-between gap-2">
                    <span>Events shown</span>
                    <span className="font-semibold text-foreground">
                      {filteredEvents.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>Image ready</span>
                    <span className="font-semibold text-foreground">
                      {filteredImageCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>Locations</span>
                    <span className="font-semibold text-foreground">
                      {stats.locations}
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-xs text-foreground/60">
                Tip: use the filter to focus on image-ready events.
              </div>
            </div>
          </aside>

          <main className="space-y-10">
            {loading ? (
              <div className="flex min-h-64 items-center justify-center rounded-3xl border border-border/70 bg-card/90">
                <p className="flex items-center gap-2 text-foreground/70">
                  <LoaderCircle className="size-5 animate-spin" />
                  Loading events...
                </p>
              </div>
            ) : null}

            {error && !loading ? (
              <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                Failed to load events: {error}
              </div>
            ) : null}

            {!loading && !error && groupedEvents.length === 0 ? (
              <div className="rounded-3xl border border-border/70 bg-card/90 p-6 text-sm text-foreground/70">
                No events match the current filters. Try clearing the search
                or toggles.
              </div>
            ) : null}

            {!loading && !error
              ? groupedEvents.map((group) => (
                  <section className="space-y-4" key={group.date}>
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                          Day
                        </p>
                        <h2 className="font-display text-2xl">
                          {formatDate(group.date)}
                        </h2>
                      </div>
                      <span className={badgeBase}>
                        {group.events.length} events
                      </span>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2">
                      {group.events.map((event, index) => {
                        const description = event.description?.trim()
                          ? event.description
                          : "Description not provided. Use the event link for details."
                        const host = getHostname(event.event_url)
                        return (
                          <article
                            className="group overflow-hidden rounded-3xl border border-border/70 bg-card/90 shadow-sm transition hover:-translate-y-1 hover:shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500"
                            key={event.id}
                            style={{ animationDelay: `${index * 60}ms` }}
                          >
                            <div className="relative h-44 overflow-hidden bg-muted sm:h-48">
                              {event.image_url ? (
                                <img
                                  alt={event.title}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                  src={event.image_url}
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-sm text-foreground/60">
                                  No image available
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                              <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2">
                                <span className={imageBadgeBase}>
                                  {formatDateShort(event.event_date)}
                                </span>
                                <span className={imageBadgeBase}>
                                  {formatTimeRange(
                                    event.event_time_start,
                                    event.event_time_end
                                  )}
                                </span>
                                {event.is_recurring ? (
                                  <span className={imageBadgeBase}>Recurring</span>
                                ) : null}
                              </div>
                            </div>
                            <div className="space-y-4 p-5">
                              <div className="space-y-2">
                                <h3 className="font-display text-lg sm:text-xl">
                                  {event.title}
                                </h3>
                                <p className="text-sm text-foreground/70">
                                  {description}
                                </p>
                              </div>
                              <div className="grid gap-3 text-sm">
                                <div className="flex items-start gap-2">
                                  <CalendarDays className="mt-0.5 size-4 shrink-0 text-foreground/60" />
                                  <div>
                                    <p className="font-medium">
                                      {formatDate(event.event_date)}
                                    </p>
                                    <p className="text-xs text-foreground/60">
                                      {formatTimeRange(
                                        event.event_time_start,
                                        event.event_time_end
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <MapPin className="mt-0.5 size-4 shrink-0 text-foreground/60" />
                                  <div>
                                    <p className="font-medium">
                                      {event.location_name ?? "Location TBD"}
                                    </p>
                                    {event.location_address ? (
                                      <p className="text-xs text-foreground/60">
                                        {event.location_address}
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs">
                                <span className={tagBase}>
                                  {event.category ?? "General"}
                                </span>
                                <span className={tagBase}>
                                  {event.is_recurring ? "Recurring" : "One-time"}
                                </span>
                                {event.client_notes ? (
                                  <span className={tagBase}>Notes added</span>
                                ) : null}
                              </div>
                              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
                                {event.event_url ? (
                                  <a
                                    className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background shadow-sm transition hover:opacity-90"
                                    href={event.event_url}
                                    rel="noreferrer"
                                    target="_blank"
                                  >
                                    Visit event page
                                    <ExternalLink className="size-3" />
                                  </a>
                                ) : (
                                  <span className="text-xs text-foreground/60">
                                    No external link
                                  </span>
                                )}
                                <span className="text-xs text-foreground/60">
                                  {host ? `Source: ${host}` : "Source not set"}
                                </span>
                              </div>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  </section>
                ))
              : null}
          </main>
        </div>
      </div>
    </div>
  )
}
