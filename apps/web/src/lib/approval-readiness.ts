import {
  filterWeeklyEvents,
  getWeeklyWindow,
  type EventItem,
} from "./events"
import type { PlatformContext } from "./platform-config"

export type EventSourceRow = {
  slug: string
  source_name?: string
  source_url?: string
  is_active?: boolean
  last_scraped_at?: string | null
}

export type ReadinessGate = {
  id: string
  label: string
  status: "pass" | "fail" | "warn" | "pending"
  detail: string
}

export type ApprovalReadiness = {
  generated_at: string
  week_window: ReturnType<typeof getWeeklyWindow>
  gates: ReadinessGate[]
  events_in_week: number
  events_published: number
  sources_never_scraped: number
  sources_stale: number
  sponsor_ready: boolean
  heygen_media_ready: boolean
  video_ready: boolean
  next_actions: string[]
}

const STALE_SOURCE_DAYS = 14
const MIN_WEEK_EVENTS = 3

const HEYGEN_PLACEHOLDERS = [
  "PASTE_HEYGEN_AVATAR_ID",
  "PASTE_HEYGEN_VOICE_ID",
  "PASTE_HEYGEN_TEMPLATE_ID",
]

function isPlaceholder(value: string | null | undefined): boolean {
  if (!value?.trim()) return true
  return HEYGEN_PLACEHOLDERS.some((p) => value.includes(p))
}

function sourceStatus(source: EventSourceRow, now: Date): "current" | "stale" | "never" | "inactive" {
  if (source.is_active === false) return "inactive"
  if (!source.last_scraped_at) return "never"
  const scraped = new Date(source.last_scraped_at)
  const days = Math.round((now.getTime() - scraped.getTime()) / 86400000)
  return days > STALE_SOURCE_DAYS ? "stale" : "current"
}

export function assessApprovalReadiness(
  platform: PlatformContext,
  events: EventItem[],
  referenceDate = new Date()
): ApprovalReadiness {
  const now = referenceDate
  const weekWindow =
    platform.week_context?.week_start && platform.week_context?.week_end
      ? {
          start: platform.week_context.week_start,
          end: platform.week_context.week_end,
          label: getWeeklyWindow(
            referenceDate,
            platform.brand.week_window_start_dow ?? 4,
            platform.brand.week_window_days ?? 7
          ).label,
        }
      : getWeeklyWindow(
          referenceDate,
          platform.brand.week_window_start_dow ?? 4,
          platform.brand.week_window_days ?? 7
        )

  const weeklyEvents = filterWeeklyEvents(events, weekWindow)
  const sources = (platform.event_sources || []) as EventSourceRow[]
  const activeSources = sources.filter((s) => s.is_active !== false)

  let neverScraped = 0
  let stale = 0
  for (const s of activeSources) {
    const st = sourceStatus(s, now)
    if (st === "never") neverScraped += 1
    if (st === "stale") stale += 1
  }

  const hasWeekContext = Boolean(
    platform.week_context?.week_start && platform.week_context?.week_end
  )
  const sponsorReady = Boolean(platform.weekly_sponsor?.display_name)
  const avatarOk = !isPlaceholder(platform.heygen?.avatar_id)
  const voiceOk = !isPlaceholder(platform.heygen?.voice_id)
  const heygenMediaReady = avatarOk && voiceOk
  const eventsOk = weeklyEvents.length >= MIN_WEEK_EVENTS
  const sourcesOk = activeSources.length > 0 && neverScraped === 0 && stale === 0

  const gates: ReadinessGate[] = [
    {
      id: "events_week",
      label: "Current-week events",
      status: eventsOk ? "pass" : weeklyEvents.length > 0 ? "warn" : "fail",
      detail: `${weeklyEvents.length} in window (need ≥ ${MIN_WEEK_EVENTS})`,
    },
    {
      id: "event_sources",
      label: "Event source freshness",
      status: sourcesOk ? "pass" : neverScraped > 0 ? "fail" : stale > 0 ? "warn" : "pending",
      detail: `${activeSources.length} active · ${neverScraped} never scraped · ${stale} stale`,
    },
    {
      id: "sponsor_gate",
      label: "Weekly sponsor",
      status: sponsorReady ? "pass" : hasWeekContext ? "warn" : "pending",
      detail: sponsorReady
        ? platform.weekly_sponsor!.display_name
        : hasWeekContext
          ? "week_context OK — assign sponsor for this week"
          : "Apply sponsor migration (week_context missing)",
    },
    {
      id: "heygen_avatar",
      label: "HeyGen avatar",
      status: avatarOk ? "pass" : "fail",
      detail: avatarOk ? "Configured" : "Paste avatar_id in heygen_config",
    },
    {
      id: "heygen_voice",
      label: "HeyGen voice",
      status: voiceOk ? "pass" : "fail",
      detail: voiceOk ? "Configured" : "Paste voice_id in heygen_config",
    },
    {
      id: "multi_city",
      label: "Multi-city platform RPC",
      status: platform.brand.brand_slug && platform.city.slug ? "pass" : "fail",
      detail: `${platform.brand.brand_slug} → ${platform.city.display_name}`,
    },
  ]

  const next_actions: string[] = []
  if (!eventsOk) {
    next_actions.push("Run n8n scrape workflow to refresh current-week events")
  }
  if (neverScraped > 0 || stale > 0) {
    next_actions.push("Re-run scrape so event_sources.last_scraped_at is current")
  }
  if (!hasWeekContext) {
    next_actions.push("Apply 02-Supabase/proposed_sponsor_management.sql in GMO-PROD SQL Editor")
  } else if (!sponsorReady) {
    next_actions.push("Seed or assign sponsor_week_assignment for this week")
  }
  if (!heygenMediaReady) {
    next_actions.push("Update heygen_config with real HeyGen avatar and voice IDs")
  }
  if (eventsOk && sourcesOk && sponsorReady && heygenMediaReady) {
    next_actions.push("Run: node 03-n8n/generate-phase2-payload.mjs")
  }

  const video_ready =
    eventsOk && sourcesOk && sponsorReady && heygenMediaReady && hasWeekContext

  return {
    generated_at: now.toISOString(),
    week_window: weekWindow,
    gates,
    events_in_week: weeklyEvents.length,
    events_published: events.length,
    sources_never_scraped: neverScraped,
    sources_stale: stale,
    sponsor_ready: sponsorReady,
    heygen_media_ready: heygenMediaReady,
    video_ready,
    next_actions,
  }
}
