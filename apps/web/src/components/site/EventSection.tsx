import { EventCard } from "@/components/EventCard"
import type { EventItem } from "@/lib/events"

type EventSectionProps = {
  id: string
  title: string
  description: string
  events: EventItem[]
  featured?: boolean
  emptyMessage?: string
}

export function EventSection({
  id,
  title,
  description,
  events,
  featured = false,
  emptyMessage = "No events in this section.",
}: EventSectionProps) {
  return (
    <section className="scroll-mt-24" id={id}>
      {title ? (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-foreground/65">{description}</p>
            ) : null}
          </div>
          <span className="rounded-full border border-border/60 bg-background px-3 py-1 text-xs">
            {events.length} events
          </span>
        </div>
      ) : null}

      {events.length === 0 ? (
        <p className="text-sm text-foreground/60">{emptyMessage}</p>
      ) : featured ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {events.map((event) => (
            <EventCard event={event} featured key={event.id} />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard event={event} key={event.id} />
          ))}
        </div>
      )}
    </section>
  )
}

type PlaceholderSectionProps = {
  id: string
  title: string
  description: string
  status: string
}

export function PlaceholderSection({
  id,
  title,
  description,
  status,
}: PlaceholderSectionProps) {
  return (
    <section className="scroll-mt-24" id={id}>
      <h2 className="font-display text-2xl">{title}</h2>
      <p className="mt-1 text-sm text-foreground/65">{description}</p>
      <div className="mt-4 rounded-xl border border-dashed border-border/70 bg-muted/20 px-5 py-8 text-center">
        <p className="text-sm font-medium text-foreground/70">{status}</p>
      </div>
    </section>
  )
}
