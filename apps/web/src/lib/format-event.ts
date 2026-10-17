import type { EventItem } from "./events"

export function formatEventDateDisplay(eventDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${eventDate}T12:00:00`))
}

export function formatEventTimeDisplay(
  eventTimeStart: string | null | undefined
): string | null {
  if (!eventTimeStart) return null
  return eventTimeStart.slice(0, 5)
}

export function resolveSourceUrl(event: EventItem): string | null {
  return event.source_url || event.event_url || null
}

function formatSpokenTime(eventTimeStart: string): string | null {
  const [h, m] = eventTimeStart.slice(0, 5).split(":").map(Number)
  const d = new Date()
  d.setHours(h, m ?? 0, 0, 0)
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: m ? "2-digit" : undefined,
  }).format(d)
}

function formatWeekdayPhrase(eventDate: string, referenceDate = new Date()): string {
  const event = new Date(`${eventDate}T12:00:00`)
  const ref = new Date(referenceDate)
  ref.setHours(12, 0, 0, 0)
  event.setHours(12, 0, 0, 0)

  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(event)
  const diffDays = Math.round((event.getTime() - ref.getTime()) / 86400000)

  if (diffDays >= 0 && diffDays <= 6) {
    return `This ${weekday}`
  }

  const monthDay = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
  }).format(event)
  return `${weekday}, ${monthDay}`
}

const GENERIC_VENUES = new Set(["tbd", "okoboji venue"])

function firstSentence(text: string, maxLen = 140): string {
  const trimmed = text.trim()
  if (!trimmed) return ""
  const sentence = trimmed.split(/[.!?]/)[0].trim()
  if (!sentence) return ""
  if (sentence.length <= maxLen) return sentence
  return `${sentence.slice(0, maxLen - 3).trim()}...`
}

function cleanVenueName(name: string): string {
  return String(name || "")
    .replace(/[!.,]+$/, "")
    .trim()
}

function extractVenueFromDescription(description: string | null | undefined): string | null {
  const m = String(description || "").match(/\bat\s+(.+?)(?:\s+with\b|[.,!]|$)/i)
  return m ? cleanVenueName(m[1]) : null
}

function resolveVenue(event: EventItem): string | null {
  const loc = cleanVenueName(event.location_name || "")
  if (loc && !GENERIC_VENUES.has(loc.toLowerCase())) return loc
  return extractVenueFromDescription(event.description) || null
}

function inferShortDescription(event: EventItem): string {
  const title = event.title || ""
  if (/live music/i.test(title)) return "live music on the lakes"
  if (/trivia/i.test(title)) return "trivia night"
  if (/bingo/i.test(title)) return "bingo night"
  if (/golf|scramble/i.test(title)) return "golf at the lakes"
  if (/tournament/i.test(title)) return "a tournament at the lakes"
  if (/wine|winery/i.test(title)) return "an evening at the winery"
  return "a great time at the lakes"
}

function shortDescription(event: EventItem, venue: string | null): string {
  const raw = (event.description || "").trim()
  if (raw) {
    let sentence = firstSentence(raw)
    sentence = sentence.replace(/^join us for\s+/i, "")
    sentence = sentence.replace(/^(another\s+)?great\s+(day|night|afternoon)\s+of\s+/i, "")

    if (venue) {
      const venuePattern = new RegExp(
        `\\s+at\\s+${venue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
        "i"
      )
      sentence = sentence.replace(venuePattern, "")
    }

    if (/live music/i.test(sentence)) {
      if (/on the water/i.test(sentence)) return "live music on the water"
      const guests = sentence.match(/\blive music\s+with\s+(.+)$/i)
      if (guests) return guests[1].trim()
      const tail = sentence.match(/\bwith\s+(.+)$/i)
      if (tail) return tail[1].trim()
      return "live music at the lakes"
    }

    if (sentence.length > 100) return firstSentence(sentence, 100)
    return sentence
  }
  return inferShortDescription(event)
}

function isRedundantDescription(desc: string, title: string): boolean {
  const d = desc.toLowerCase().trim()
  const t = title.toLowerCase()
  if (d === "bingo night" && t.includes("bingo")) return true
  if (d === "trivia night" && t.includes("trivia")) return true
  if (d === "live music on the lakes" && /live music/i.test(t)) return true
  return false
}

function venueVerb(title: string): "returns to" | "at" {
  const words = title.trim().split(/\s+/)
  const looksLikeAct =
    words.length <= 3 &&
    !/live music|trivia|bingo|night|tournament|golf|scramble|music at/i.test(title)
  return looksLikeAct ? "returns to" : "at"
}

/** Single spoken sentence — rank_score never included */
export function formatEventSpeechLine(
  event: EventItem,
  referenceDate = new Date()
): string {
  const title = (event.title || "Event").trim()
  const when = formatWeekdayPhrase(event.event_date, referenceDate)
  const time = event.event_time_start
    ? formatSpokenTime(event.event_time_start)
    : null
  const venue = resolveVenue(event)
  const desc = shortDescription(event, venue)

  let opener = when
  if (time) opener = `${when} at ${time}`

  let body: string
  if (venue) {
    const verb = venueVerb(title)
    body = verb === "returns to" ? `${title} ${verb} ${venue}` : `${title} at ${venue}`
  } else {
    body = title
  }

  let sentence = `${opener}, ${body}`

  if (desc && !isRedundantDescription(desc, title)) {
    const lower = desc.charAt(0).toLowerCase() + desc.slice(1)
    const trimmed = desc.trim()
    const useNarrative =
      trimmed.length > 55 || /\.\.\.$/.test(trimmed) || /[.!?]$/.test(trimmed)
    if (/^(live music|trivia|bingo|golf|a tournament|an evening)/i.test(lower)) {
      sentence += ` with ${lower}`
    } else if (useNarrative) {
      sentence += `. ${trimmed}`
    } else {
      sentence += ` with ${desc}`
    }
  }

  sentence = sentence.replace(/\s+/g, " ").trim()
  if (!/[.!?]$/.test(sentence)) sentence += "."
  return sentence
}

export function formatEventBlock(
  event: EventItem,
  _index: number,
  referenceDate = new Date()
): string {
  return formatEventSpeechLine(event, referenceDate)
}

export function formatEventsList(
  events: EventItem[],
  options: { referenceDate?: Date } = {}
): string {
  if (!events.length) return "No events."
  const referenceDate = options.referenceDate ?? new Date()
  return events
    .map((e) => formatEventSpeechLine(e, referenceDate))
    .join("\n\n")
}
