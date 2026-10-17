/**
 * Additive popularity scoring — keep in sync with 03-n8n/lib/compute-popularity-score.mjs
 */
import type { EventItem } from "./events"

const BASE = 50

const VENUE_TIER_A = [
  "arnolds park",
  "barefoot",
  "empathy",
  "little swan",
  "okoboji summer theatre",
  "west o beer",
  "round lake vineyard",
]
const VENUE_TIER_B = [
  "pearson lakes",
  "emerald hills",
  "snapper",
  "okoboji view",
  "vfw",
  "marina",
]

const CATEGORY_RULES = [
  { re: /\b(concert|live music|tenors|band\b|dj\b|festival|fair\b)/i, boost: 25, label: "live_entertainment" },
  { re: /\b(golf|tournament|scramble|marathon|5k|run\b)/i, boost: 12, label: "sports" },
  { re: /\b(wine|winery|brewery|beer run|trivia|bingo|music bingo)/i, boost: 15, label: "nightlife" },
  { re: /\b(art class|theatre|theater|murder on|sister act|ring of fire)/i, boost: 18, label: "performing_arts" },
  { re: /\b(cruise|boat|marina|fishing|regatta)/i, boost: 14, label: "lake_outdoor" },
  { re: /\b(family|kids|children|preschool|storytime|teen art)/i, boost: 8, label: "family" },
]

const NICHE_PENALTY_RULES = [
  { re: /\b(book club|library|memorial library|storytime|preschool picasso)/i, penalty: 18, label: "library_program" },
  { re: /\b(kiwanis|knights of columbus|k of c|vfw bingo|members only|private club)/i, penalty: 22, label: "civic_club" },
  { re: /\b(board meeting|committee|planning commission)/i, penalty: 30, label: "government" },
]

const SOURCE_DOMAIN_BOOST = [
  { re: /vacationokoboji|exploreokoboji|arnoldspark|okoboji\.com/i, boost: 8 },
  { re: /eventbrite/i, boost: 5 },
  { re: /facebook/i, boost: 0 },
]

export type ScoreBreakdown = {
  base: number
  category: number
  category_label: string
  venue: number
  venue_tier: string
  ticket: number
  source: number
  date_proximity: number
  days_out: number | null
  consensus: number
  manual: number
  niche_penalty: number
  niche_labels: string[]
}

export type ScoredEvent = {
  event_id: string
  title: string
  event_date: string
  score: number
  breakdown: ScoreBreakdown
  video_eligible: boolean
  previous_rank_score: number | null
  status: string | null
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)))
}

function textBlob(event: EventItem) {
  return [event.title, event.description, event.location_name, event.category]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

function normalizeTitle(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

function eventFingerprint(event: EventItem) {
  if (event.dedup_key) return `dedup:${event.dedup_key}`
  return `title-date:${normalizeTitle(event.title)}|${event.event_date || ""}`
}

function buildConsensusSignals(events: EventItem[]) {
  const clusters = new Map<
    string,
    { source_urls: Set<string>; event_ids: string[]; count: number }
  >()

  for (const event of events) {
    const fp = eventFingerprint(event)
    const existing = clusters.get(fp) || {
      source_urls: new Set<string>(),
      event_ids: [],
      count: 0,
    }
    existing.count += 1
    existing.event_ids.push(event.id)
    if (event.source_url) existing.source_urls.add(event.source_url)
    clusters.set(fp, existing)
  }

  const signals = new Map<string, { consensus_boost: number; source_count: number }>()
  for (const cluster of clusters.values()) {
    const sourceCount = cluster.source_urls.size || 1
    const consensus_boost = sourceCount >= 2 ? Math.min(15, (sourceCount - 1) * 5) : 0
    for (const id of cluster.event_ids) {
      signals.set(id, { consensus_boost, source_count: sourceCount })
    }
  }
  return signals
}

export function parseManualBoost(clientNotes: string | null) {
  if (!clientNotes?.trim()) return 0
  try {
    const parsed = JSON.parse(clientNotes) as { manual_rank_boost?: number }
    if (typeof parsed.manual_rank_boost === "number") {
      return clamp(parsed.manual_rank_boost, -30, 30)
    }
  } catch {
    /* plain text notes */
  }
  return 0
}

export function buildClientNotesWithManualBoost(
  existingNotes: string | null,
  manualBoost: number
): string | null {
  let base: Record<string, unknown> = {}
  if (existingNotes?.trim()) {
    try {
      const parsed = JSON.parse(existingNotes)
      base =
        typeof parsed === "object" && parsed !== null
          ? (parsed as Record<string, unknown>)
          : { note: existingNotes }
    } catch {
      base = { note: existingNotes }
    }
  }
  if (manualBoost === 0) {
    delete base.manual_rank_boost
  } else {
    base.manual_rank_boost = clamp(manualBoost, -30, 30)
  }
  if (Object.keys(base).length === 0) return null
  return JSON.stringify(base)
}

export function isRankManual(event: EventItem) {
  return event.status === "rank_manual"
}

function scoreCategory(text: string) {
  let best = { boost: 0, label: "general" }
  for (const rule of CATEGORY_RULES) {
    if (rule.re.test(text) && rule.boost > best.boost) {
      best = { boost: rule.boost, label: rule.label }
    }
  }
  return best
}

function scoreVenue(locationName: string | null) {
  const loc = String(locationName || "").toLowerCase()
  if (!loc) return { boost: 0, tier: "none" }
  if (VENUE_TIER_A.some((v) => loc.includes(v))) return { boost: 15, tier: "A" }
  if (VENUE_TIER_B.some((v) => loc.includes(v))) return { boost: 8, tier: "B" }
  if (loc.includes("okoboji") && loc !== "okoboji") return { boost: 3, tier: "local" }
  return { boost: 0, tier: "none" }
}

function scoreNichePenalty(text: string) {
  let penalty = 0
  const labels: string[] = []
  for (const rule of NICHE_PENALTY_RULES) {
    if (rule.re.test(text)) {
      penalty = Math.max(penalty, rule.penalty)
      labels.push(rule.label)
    }
  }
  return { penalty, labels }
}

function scoreTicketSignal(event: EventItem) {
  const url = `${event.event_url || ""} ${event.source_url || ""}`.toLowerCase()
  if (/eventbrite|ticketmaster|tickets|\/register|checkout/i.test(url)) {
    return { boost: 10, label: "ticketed" }
  }
  return { boost: 0, label: "unknown" }
}

function scoreSourceAuthority(event: EventItem) {
  let boost = 0
  const url = event.source_url || ""
  for (const rule of SOURCE_DOMAIN_BOOST) {
    if (rule.re.test(url)) boost = Math.max(boost, rule.boost)
  }
  return { boost, label: "source_url" }
}

function scoreDateProximity(eventDate: string, referenceDate = new Date()) {
  if (!eventDate) return { boost: 0, days_out: null as number | null }
  const event = new Date(`${eventDate}T12:00:00`)
  const ref = new Date(referenceDate)
  ref.setHours(12, 0, 0, 0)
  const daysOut = Math.round((event.getTime() - ref.getTime()) / 86400000)
  if (daysOut < 0) return { boost: -5, days_out: daysOut }
  if (daysOut <= 2) return { boost: 8, days_out: daysOut }
  if (daysOut <= 6) return { boost: 5, days_out: daysOut }
  return { boost: 0, days_out: daysOut }
}

export function scoreEvent(
  event: EventItem,
  ctx: { consensusBoost?: number; referenceDate?: Date; manualBoost?: number } = {}
) {
  const text = textBlob(event)
  const category = scoreCategory(text)
  const venue = scoreVenue(event.location_name)
  const niche = scoreNichePenalty(text)
  const ticket = scoreTicketSignal(event)
  const source = scoreSourceAuthority(event)
  const date = scoreDateProximity(event.event_date, ctx.referenceDate)
  const consensusBoost = ctx.consensusBoost ?? 0
  const manualBoost = ctx.manualBoost ?? 0

  const raw =
    BASE +
    category.boost +
    venue.boost +
    ticket.boost +
    source.boost +
    date.boost +
    consensusBoost +
    manualBoost -
    niche.penalty

  const score = clamp(raw)

  return {
    score,
    breakdown: {
      base: BASE,
      category: category.boost,
      category_label: category.label,
      venue: venue.boost,
      venue_tier: venue.tier,
      ticket: ticket.boost,
      source: source.boost,
      date_proximity: date.boost,
      days_out: date.days_out,
      consensus: consensusBoost,
      manual: manualBoost,
      niche_penalty: niche.penalty,
      niche_labels: niche.labels,
    },
    video_eligible: score >= 70,
  }
}

export function scoreEvents(events: EventItem[], referenceDate = new Date()): ScoredEvent[] {
  const signals = buildConsensusSignals(events)

  return events.map((event) => {
    const signal = signals.get(event.id)
    const manualBoost = parseManualBoost(event.client_notes)
    const result = scoreEvent(event, {
      consensusBoost: signal?.consensus_boost ?? 0,
      referenceDate,
      manualBoost,
    })
    return {
      event_id: event.id,
      title: event.title,
      event_date: event.event_date,
      previous_rank_score: event.rank_score,
      status: event.status,
      ...result,
    }
  })
}

export function formatBreakdown(b: ScoreBreakdown) {
  const parts = [
    `base ${b.base}`,
    b.category ? `+${b.category} ${b.category_label}` : null,
    b.venue ? `+${b.venue} venue ${b.venue_tier}` : null,
    b.ticket ? `+${b.ticket} ticketed` : null,
    b.source ? `+${b.source} source` : null,
    b.date_proximity ? `+${b.date_proximity} date (${b.days_out}d)` : null,
    b.consensus ? `+${b.consensus} consensus` : null,
    b.manual ? `${b.manual > 0 ? "+" : ""}${b.manual} manual` : null,
    b.niche_penalty ? `−${b.niche_penalty} niche` : null,
  ].filter(Boolean)
  return parts.join(" · ")
}
