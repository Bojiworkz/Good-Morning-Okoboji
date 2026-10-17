import { useMemo, useState } from "react"
import type { EventItem } from "@/lib/events"
import { filterWeeklyEvents, getWeeklyWindow, sortEvents } from "@/lib/events"
import { mergeRankIntoEvents, updateEventRank } from "@/lib/event-ranking"
import {
  formatBreakdown,
  isRankManual,
  scoreEvents,
  type ScoredEvent,
} from "@/lib/ranking-scoring"
import type { PlatformContext } from "@/lib/platform-config"

type EventRankingPanelProps = {
  platform: PlatformContext
  events: EventItem[]
  onEventsChange: (events: EventItem[]) => void
}

function formatShortDate(dateString: string) {
  const date = new Date(`${dateString}T12:00:00`)
  if (Number.isNaN(date.getTime())) return dateString
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date)
}

export function EventRankingPanel({
  platform,
  events,
  onEventsChange,
}: EventRankingPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [draftScores, setDraftScores] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const weeklyWindow = useMemo(
    () =>
      getWeeklyWindow(
        new Date(),
        platform.brand.week_window_start_dow ?? 4,
        platform.brand.week_window_days ?? 7
      ),
    [platform.brand.week_window_start_dow, platform.brand.week_window_days]
  )

  const weekEvents = useMemo(
    () => filterWeeklyEvents(events, weeklyWindow),
    [events, weeklyWindow]
  )

  const scored = useMemo(() => {
    const rows = scoreEvents(weekEvents)
    return rows.sort(
      (a, b) =>
        b.score - a.score ||
        String(a.event_date).localeCompare(String(b.event_date)) ||
        a.title.localeCompare(b.title)
    )
  }, [weekEvents])

  const videoEligibleCount = scored.filter((r) => r.video_eligible).length
  const manualCount = weekEvents.filter(isRankManual).length

  const displayScore = (row: ScoredEvent, event: EventItem) => {
    if (isRankManual(event)) {
      return row.previous_rank_score ?? row.score
    }
    return row.score
  }

  async function saveManual(event: EventItem, computed: ScoredEvent) {
    const raw = draftScores[event.id] ?? String(displayScore(computed, event))
    const score = Number(raw)
    if (Number.isNaN(score) || score < 0 || score > 100) {
      setMessage("Score must be 0–100.")
      return
    }

    setBusyId(event.id)
    setMessage(null)
    try {
      await updateEventRank(event.id, score, {
        manual: true,
        clientNotes: event.client_notes,
      })
      onEventsChange(
        mergeRankIntoEvents(events, event.id, score, "rank_manual")
      )
      setMessage(`Locked "${event.title}" at ${Math.round(score)}.`)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed.")
    } finally {
      setBusyId(null)
    }
  }

  async function applyAutoForEvent(event: EventItem, computed: ScoredEvent) {
    setBusyId(event.id)
    setMessage(null)
    try {
      await updateEventRank(event.id, computed.score, { manual: false })
      onEventsChange(
        mergeRankIntoEvents(events, event.id, computed.score, "published")
      )
      setDraftScores((d) => {
        const next = { ...d }
        delete next[event.id]
        return next
      })
      setMessage(`Auto-scored "${event.title}" → ${computed.score}.`)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Auto-rank failed.")
    } finally {
      setBusyId(null)
    }
  }

  async function autoRankWeek() {
    setBulkBusy(true)
    setMessage(null)
    let updated = 0
    let nextEvents = events
    try {
      for (const row of scored) {
        const event = weekEvents.find((e) => e.id === row.event_id)
        if (!event || isRankManual(event)) continue
        await updateEventRank(event.id, row.score, { manual: false })
        nextEvents = mergeRankIntoEvents(nextEvents, event.id, row.score, "published")
        updated += 1
      }
      onEventsChange(sortEvents(nextEvents))
      setMessage(`Auto-ranked ${updated} event(s) for ${weeklyWindow.label}.`)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Bulk auto-rank failed.")
    } finally {
      setBulkBusy(false)
    }
  }

  return (
    <section className="rounded-xl border border-border/70 bg-background p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl">Event ranking</h2>
          <p className="mt-1 text-sm text-foreground/65">
            Week of {weeklyWindow.label} · {scored.length} events ·{" "}
            {videoEligibleCount} video-eligible (≥70) · {manualCount} operator-locked
          </p>
          <p className="mt-1 text-xs text-foreground/50">
            Run{" "}
            <code className="rounded bg-muted px-1">node compute-and-apply-ranks.mjs</code>{" "}
            after ingest for full catalog refresh.
          </p>
        </div>
        <button
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          disabled={bulkBusy || scored.length === 0}
          onClick={() => void autoRankWeek()}
          type="button"
        >
          {bulkBusy ? "Applying…" : "Auto-rank this week"}
        </button>
      </div>

      {message ? (
        <p className="mt-4 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
          {message}
        </p>
      ) : null}

      {scored.length === 0 ? (
        <p className="mt-4 text-sm text-foreground/60">No events in the current week window.</p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border/60 text-xs uppercase tracking-wide text-foreground/55">
                <th className="pb-2 pr-3 font-medium">#</th>
                <th className="pb-2 pr-3 font-medium">Event</th>
                <th className="pb-2 pr-3 font-medium">Date</th>
                <th className="pb-2 pr-3 font-medium">Score</th>
                <th className="pb-2 pr-3 font-medium">Formula</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {scored.map((row, index) => {
                const event = weekEvents.find((e) => e.id === row.event_id)!
                const locked = isRankManual(event)
                const shown = displayScore(row, event)
                const draft = draftScores[event.id] ?? String(shown)
                const expanded = expandedId === event.id

                return (
                  <tr
                    className="border-b border-border/40 align-top"
                    key={row.event_id}
                  >
                    <td className="py-3 pr-3 text-foreground/50">{index + 1}</td>
                    <td className="py-3 pr-3">
                      <p className="font-medium leading-snug">{row.title}</p>
                      {event.location_name ? (
                        <p className="mt-0.5 text-xs text-foreground/55">
                          {event.location_name}
                        </p>
                      ) : null}
                      {locked ? (
                        <span className="mt-1 inline-block rounded-full bg-violet-500/15 px-2 py-0.5 text-xs text-violet-900">
                          manual lock
                        </span>
                      ) : null}
                      {row.video_eligible ? (
                        <span className="mt-1 ml-1 inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-800">
                          video
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3 pr-3 whitespace-nowrap text-foreground/70">
                      {formatShortDate(row.event_date)}
                    </td>
                    <td className="py-3 pr-3">
                      <input
                        className="w-16 rounded border border-border/70 bg-background px-2 py-1 text-sm"
                        max={100}
                        min={0}
                        onChange={(e) =>
                          setDraftScores((d) => ({ ...d, [event.id]: e.target.value }))
                        }
                        type="number"
                        value={draft}
                      />
                      {row.previous_rank_score != null &&
                      row.previous_rank_score !== row.score &&
                      !locked ? (
                        <p className="mt-0.5 text-xs text-foreground/45">
                          was {row.previous_rank_score}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-3 pr-3 max-w-xs">
                      <button
                        className="text-left text-xs text-foreground/60 underline decoration-dotted hover:text-foreground"
                        onClick={() =>
                          setExpandedId(expanded ? null : event.id)
                        }
                        type="button"
                      >
                        {expanded ? "Hide" : "Show"} breakdown
                      </button>
                      {expanded ? (
                        <p className="mt-1 text-xs leading-relaxed text-foreground/65">
                          {formatBreakdown(row.breakdown)}
                        </p>
                      ) : (
                        <p className="mt-0.5 truncate text-xs text-foreground/45">
                          auto {row.score}
                          {locked ? ` · locked ${shown}` : ""}
                        </p>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded border border-border/70 px-2 py-1 text-xs hover:bg-muted/40 disabled:opacity-50"
                          disabled={busyId === event.id}
                          onClick={() => void saveManual(event, row)}
                          type="button"
                        >
                          Lock score
                        </button>
                        <button
                          className="rounded border border-border/70 px-2 py-1 text-xs hover:bg-muted/40 disabled:opacity-50"
                          disabled={busyId === event.id}
                          onClick={() => void applyAutoForEvent(event, row)}
                          type="button"
                        >
                          Apply auto
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
