import type { EventItem } from "../lib/events"

function formatDate(dateString: string) {
  const date = new Date(`${dateString}T12:00:00`)
  if (Number.isNaN(date.getTime())) return dateString
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date)
}

function formatTimeRange(start: string | null, end: string | null) {
  if (!start && !end) return "Check source for time"
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
  if (startTime && endTime) return `${startTime} – ${endTime}`
  return startTime ?? endTime ?? "Check source for time"
}

type EventCardProps = {
  event: EventItem
  featured?: boolean
}

export function EventCard({ event, featured = false }: EventCardProps) {
  const link = event.event_url || event.source_url

  return (
    <article
      className={`overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-sm transition hover:shadow-lg ${
        featured ? "ring-2 ring-amber-400/40" : ""
      }`}
    >
      <div className={`relative bg-muted ${featured ? "h-48" : "h-40"}`}>
        {event.image_url ? (
          <img
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            src={event.image_url}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-foreground/50">
            Explore Okoboji
          </div>
        )}
        {featured && (event.rank_score ?? 0) > 0 ? (
          <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white">
            Top pick
          </span>
        ) : null}
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg leading-snug">{event.title}</h3>
        </div>
        {event.description ? (
          <p className="line-clamp-2 text-sm text-foreground/70">
            {event.description}
          </p>
        ) : null}
        <div className="space-y-1 text-sm text-foreground/80">
          <p>
            <span className="font-medium">When:</span> {formatDate(event.event_date)}{" "}
            · {formatTimeRange(event.event_time_start, event.event_time_end)}
          </p>
          <p>
            <span className="font-medium">Where:</span>{" "}
            {event.location_name ?? "Location TBD"}
          </p>
        </div>
        {event.category ? (
          <span className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs">
            {event.category}
          </span>
        ) : null}
        {link ? (
          <a
            className="inline-block text-sm font-semibold text-foreground underline-offset-4 hover:underline"
            href={link}
            rel="noreferrer"
            target="_blank"
          >
            Event details →
          </a>
        ) : null}
      </div>
    </article>
  )
}
