import { EventCard } from "@/components/EventCard"
import type { DayTopEvents } from "@/lib/event-sections"

type TopEventsByDayProps = {
  id: string
  title: string
  description: string
  days: DayTopEvents[]
  emptyMessage?: string
}

export function TopEventsByDay({
  id,
  title,
  description,
  days,
  emptyMessage = "No events this week.",
}: TopEventsByDayProps) {
  const totalEvents = days.reduce((sum, day) => sum + day.events.length, 0)

  return (
    <section className="scroll-mt-24" id={id}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">{title}</h2>
          <p className="mt-1 text-sm text-foreground/65">{description}</p>
        </div>
        <span className="rounded-full border border-border/60 bg-background px-3 py-1 text-xs">
          {days.length} days · {totalEvents} picks
        </span>
      </div>

      {days.length === 0 ? (
        <p className="text-sm text-foreground/60">{emptyMessage}</p>
      ) : (
        <div className="space-y-10">
          {days.map((day) => (
            <div key={day.date}>
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-border/50 pb-2">
                <h3 className="font-display text-xl">{day.label}</h3>
                <span className="text-xs text-foreground/50">
                  {day.events.length} audience highlights
                </span>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {day.events.map((event, index) => (
                  <EventCard
                    event={event}
                    featured={index === 0}
                    key={event.id}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
