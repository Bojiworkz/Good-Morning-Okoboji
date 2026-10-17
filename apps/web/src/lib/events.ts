import { getSupabaseConfig } from "./supabase"
import { getBrandSlug, type BrandConfig, type CityConfig } from "./platform-config"

export type EventItem = {
  id: string
  city_id: string
  city_config_id?: string | null
  publish_batch_id: string | null
  title: string
  slug: string | null
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
  source_url: string | null
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

export const EVENTS_SELECT =
  "id,city_id,city_config_id,publish_batch_id,title,slug,description,event_date,event_time_start,event_time_end,is_recurring,location_name,location_address,category,image_url,event_url,source_url,dedup_key,rank_score,is_published,auto_published,client_notes,reviewed_at,created_at,updated_at,status"

export type WeeklyWindow = {
  start: string
  end: string
  label: string
}

export function getCalendarDate(reference: Date, timeZone = "America/Chicago"): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(reference)
  const value = (type: string) => parts.find((part) => part.type === type)!.value
  return `${value("year")}-${value("month")}-${value("day")}`
}

export function getWeeklyWindow(
  reference = new Date(),
  startDow = 4,
  windowDays = 7
): WeeklyWindow {
  const today = new Date(`${getCalendarDate(reference)}T12:00:00`)
  today.setHours(0, 0, 0, 0)

  const dayOfWeek = today.getDay()
  const daysSinceStart = (dayOfWeek - startDow + 7) % 7
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - daysSinceStart)

  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + windowDays - 1)

  const toIso = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  }

  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  })
  const fmtYear = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  const label =
    startDate.getFullYear() === endDate.getFullYear()
      ? `${fmt.format(startDate)} – ${fmtYear.format(endDate)}`
      : `${fmtYear.format(startDate)} – ${fmtYear.format(endDate)}`

  return { start: toIso(startDate), end: toIso(endDate), label }
}

export function isWithinWeeklyWindow(
  eventDate: string,
  window: WeeklyWindow
): boolean {
  return eventDate >= window.start && eventDate <= window.end
}

export function decodeHtmlEntities(text: string | null) {
  if (!text) return ""
  const doc = new DOMParser().parseFromString(text, "text/html")
  return doc.documentElement.textContent || text
}

export function cleanEvent(event: EventItem): EventItem {
  return {
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
  }
}

/** rank_score descending, then event_date ascending */
export function sortEvents(events: EventItem[]): EventItem[] {
  return [...events].sort((a, b) => {
    const scoreDiff = (b.rank_score ?? 0) - (a.rank_score ?? 0)
    if (scoreDiff !== 0) return scoreDiff

    const dateDiff =
      new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    if (dateDiff !== 0) return dateDiff

    return a.title.localeCompare(b.title)
  })
}

/**
 * Live events for the brand's city from Supabase (no mock data).
 * Prefer RPC when available; fallback to filtered REST on events table.
 */
export async function fetchEventsForBrand(
  city: CityConfig,
  brand: BrandConfig
): Promise<EventItem[]> {
  const { url, anonKey } = getSupabaseConfig()
  const brandSlug = brand.brand_slug || getBrandSlug()
  const rpcUrl = `${url.replace(/\/$/, "")}/rest/v1/rpc/get_brand_weekly_events`

  const rpcResponse = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_brand_slug: brandSlug }),
  })

  if (rpcResponse.ok) {
    const data = (await rpcResponse.json()) as EventItem[]
    return sortEvents(data.map(cleanEvent))
  }

  const endpoint = new URL(`${url.replace(/\/$/, "")}/rest/v1/events`)
  endpoint.searchParams.set("select", EVENTS_SELECT)
  endpoint.searchParams.set("is_published", "eq.true")
  endpoint.searchParams.set(
    "or",
    `(city_config_id.eq.${city.id},city_id.eq.${city.id})`
  )
  endpoint.searchParams.set("order", "rank_score.desc,event_date.asc")

  const response = await fetch(endpoint.toString(), {
    method: "GET",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(
      `Supabase events failed (${response.status}): ${body.slice(0, 200)}`
    )
  }

  const data = (await response.json()) as EventItem[]
  return sortEvents(data.map(cleanEvent))
}

export function filterWeeklyEvents(
  events: EventItem[],
  window: WeeklyWindow
): EventItem[] {
  return sortEvents(
    events.filter((e) => isWithinWeeklyWindow(e.event_date, window))
  )
}
