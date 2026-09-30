/**
 * Website event sections — EVENT_RATING_AND_VIDEO_SELECTION_STANDARD.md §7
 * and FUTURE_ENHANCEMENTS.md §8 (Website Event Directory).
 *
 * Top Events = video-eligible highlights
 * Upcoming = date-sorted forward calendar
 * Community = civic/club/library (broad website inventory, not video pool)
 * Weekly = full ranked list for the production week
 */
import type { EventItem } from "./events"
import { sortEvents } from "./events"
import { classifyEditorialTier, selectTopEvents } from "./editorial/editorial-rank.mjs"

const COMMUNITY_PATTERNS = [
  /\b(book club|library|memorial library|storytime|preschool picasso)/i,
  /\b(kiwanis|knights of columbus|k of c|vfw bingo|members only|private club)/i,
  /\b(board meeting|committee|planning commission|city council)/i,
  /\b(church|parish|worship service|bible study|youth group meeting)/i,
]

const FAMILY_PATTERNS = [
  /\b(family|kids|children|preschool|teen art|youth)/i,
]

export function isCommunityEvent(event: EventItem): boolean {
  const text = [event.title, event.description, event.location_name, event.category]
    .filter(Boolean)
    .join(" ")
  return COMMUNITY_PATTERNS.some((re) => re.test(text))
}

export function isFamilyEvent(event: EventItem): boolean {
  const text = [event.title, event.description, event.category]
    .filter(Boolean)
    .join(" ")
  return FAMILY_PATTERNS.some((re) => re.test(text))
}

export function isVideoEligible(rankScore: number | null | undefined): boolean {
  return (rankScore ?? 0) >= 70
}

function byDateAsc(a: EventItem, b: EventItem) {
  const dateDiff =
    new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  if (dateDiff !== 0) return dateDiff
  return a.title.localeCompare(b.title)
}

export type SiteEventSections = {
  topEvents: EventItem[]
  topEventsByDay: DayTopEvents[]
  upcomingEvents: EventItem[]
  communityEvents: EventItem[]
  familyEvents: EventItem[]
  weeklyEvents: EventItem[]
}

export type DayTopEvents = {
  date: string
  label: string
  events: EventItem[]
}

function formatDayLabel(date: string) {
  const parsed = new Date(`${date}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return date
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(parsed)
}


/** Top N events per calendar day in the production week, by rank_score. */
export function buildTopEventsByDay(
  events: EventItem[],
  perDayLimit = 3
): DayTopEvents[] {
  const byDate = new Map<string, EventItem[]>()

  for (const event of events) {
    const bucket = byDate.get(event.event_date) ?? []
    bucket.push(event)
    byDate.set(event.event_date, bucket)
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayEvents]) => ({
      date,
      label: formatDayLabel(date),
      events: dayEvents.slice(0, perDayLimit),
    }))
    .filter((day) => day.events.length > 0)
}

export function partitionEventsForSite(
  events: EventItem[],
  topLimit: number
): SiteEventSections {
  const weeklyEvents = sortEvents(events)
  // Share the existing editorial selector with production: audience tier first,
  // score as a secondary signal, one slot per event family.
  const candidates = weeklyEvents.filter((event) =>
    !isCommunityEvent(event) &&
    Boolean(event.location_name && (event.event_url || event.source_url)) &&
    isVideoEligible(event.rank_score) && classifyEditorialTier(event) <= 8
  )
  const topEvents = selectTopEvents(candidates, { limit: topLimit }).selected

  const perDayLimit = Math.max(2, Math.min(4, Math.ceil(topLimit / 3)))
  const topEventsByDay = buildTopEventsByDay(topEvents, perDayLimit)

  const upcomingEvents = [...events].sort(byDateAsc)
  const communityEvents = events.filter(isCommunityEvent).sort(byDateAsc)
  const familyEvents = events.filter(isFamilyEvent).sort(byDateAsc)

  return {
    topEvents,
    topEventsByDay,
    upcomingEvents,
    communityEvents,
    familyEvents,
    weeklyEvents,
  }
}
