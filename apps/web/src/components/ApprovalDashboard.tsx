import { useEffect, useMemo, useState } from "react"
import { EventRankingPanel } from "@/components/EventRankingPanel"
import {
  assessApprovalReadiness,
  type ApprovalReadiness,
  type ReadinessGate,
} from "@/lib/approval-readiness"
import {
  fetchEventsForBrand,
  type EventItem,
} from "@/lib/events"
import { fetchPlatformContext, type PlatformContext } from "@/lib/platform-config"
import { generateWeeklyScript } from "@/lib/weekly-script"
import { getShowName } from "@/lib/branding"
import { setPageMeta } from "@/lib/site-meta"

function GateBadge({ status }: { status: ReadinessGate["status"] }) {
  const styles: Record<ReadinessGate["status"], string> = {
    pass: "bg-emerald-500/15 text-emerald-800 border-emerald-500/30",
    fail: "bg-red-500/15 text-red-800 border-red-500/30",
    warn: "bg-amber-500/15 text-amber-900 border-amber-500/30",
    pending: "bg-slate-500/10 text-slate-700 border-slate-500/25",
  }
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide ${styles[status]}`}
    >
      {status}
    </span>
  )
}

export function ApprovalDashboard() {
  const [platform, setPlatform] = useState<PlatformContext | null>(null)
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [operatorNote, setOperatorNote] = useState("")
  const [operatorApproved, setOperatorApproved] = useState(false)

  useEffect(() => {
    const showName = platform ? getShowName(platform.brand) : "Good Morning Okoboji"
    setPageMeta({ title: `${showName} — Approval Dashboard` })
  }, [platform])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const ctx = await fetchPlatformContext()
        const data = await fetchEventsForBrand(ctx.city, ctx.brand)
        if (!cancelled) {
          setPlatform(ctx)
          setEvents(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load approval data.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const readiness = useMemo<ApprovalReadiness | null>(() => {
    if (!platform) return null
    return assessApprovalReadiness(platform, events)
  }, [platform, events])

  const script = useMemo(() => {
    if (!platform) return ""
    return generateWeeklyScript(platform, events)
  }, [platform, events])

  const showName = platform ? getShowName(platform.brand) : "Good Morning Okoboji"

  const canOperatorApprove =
    readiness?.video_ready || (operatorNote.trim().length >= 20 && operatorApproved)

  return (
    <div className="min-h-svh bg-gradient-to-b from-[#eef4fb] via-[#faf7f2] to-[#f8f2ea] text-foreground">
      <header className="border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/60">
              Operator · {showName}
            </p>
            <h1 className="font-display text-2xl sm:text-3xl">Approval Dashboard</h1>
            <p className="mt-1 text-sm text-foreground/65">
              Video production readiness — GMO-PROD
            </p>
          </div>
          <a
            className="rounded-lg border border-border/70 bg-background px-4 py-2 text-sm hover:bg-muted/40"
            href="#/"
          >
            ← Public events
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6">
        {loading ? (
          <p className="text-foreground/70">Loading platform context and events…</p>
        ) : null}

        {error ? (
          <div
            className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {readiness && !loading && !error ? (
          <>
            <section className="rounded-xl border border-border/70 bg-background p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-xl">Production readiness</h2>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    readiness.video_ready
                      ? "bg-emerald-500/15 text-emerald-800"
                      : "bg-amber-500/15 text-amber-900"
                  }`}
                >
                  {readiness.video_ready ? "Ready for payload generation" : "Not video-ready"}
                </span>
              </div>
              <p className="mt-2 text-sm text-foreground/65">
                Week: {readiness.week_window.label} · {readiness.events_in_week} events in
                window · {readiness.events_published} published total
              </p>
            </section>

            <section className="rounded-xl border border-border/70 bg-background p-6 shadow-sm">
              <h2 className="mb-4 font-display text-xl">Readiness gates</h2>
              <ul className="space-y-3">
                {readiness.gates.map((gate) => (
                  <li
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/50 px-4 py-3"
                    key={gate.id}
                  >
                    <div>
                      <p className="font-medium">{gate.label}</p>
                      <p className="text-sm text-foreground/60">{gate.detail}</p>
                    </div>
                    <GateBadge status={gate.status} />
                  </li>
                ))}
              </ul>
            </section>

            {platform ? (
              <EventRankingPanel
                events={events}
                onEventsChange={setEvents}
                platform={platform}
              />
            ) : null}

            <section className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-background p-6 shadow-sm">
                <h2 className="font-display text-lg">Sponsor management</h2>
                {platform?.weekly_sponsor ? (
                  <dl className="mt-4 space-y-2 text-sm">
                    <div>
                      <dt className="text-foreground/55">Weekly featured</dt>
                      <dd className="font-medium">{platform.weekly_sponsor.display_name}</dd>
                    </div>
                    <div>
                      <dt className="text-foreground/55">Role</dt>
                      <dd>{platform.weekly_sponsor.sponsor_role}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="mt-3 text-sm text-foreground/60">
                    No weekly sponsor assigned. Apply sponsor SQL and seed week assignment.
                  </p>
                )}
                <p className="mt-4 text-xs text-foreground/50">
                  {(platform?.sponsors?.length ?? 0)} sponsors in platform config
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-background p-6 shadow-sm">
                <h2 className="font-display text-lg">Avatar & voice profiles</h2>
                <dl className="mt-4 space-y-2 text-sm">
                  <div>
                    <dt className="text-foreground/55">Avatar ID</dt>
                    <dd className="font-mono text-xs break-all">
                      {platform?.heygen?.avatar_id || "(not set)"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-foreground/55">Voice ID</dt>
                    <dd className="font-mono text-xs break-all">
                      {platform?.heygen?.voice_id || "(not set)"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-foreground/55">Host</dt>
                    <dd>{platform?.heygen?.host_name || platform?.brand.heygen_host_label || "—"}</dd>
                  </div>
                </dl>
              </div>
            </section>

            <section className="rounded-xl border border-border/70 bg-background p-6 shadow-sm">
              <h2 className="font-display text-lg">Next actions</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-foreground/80">
                {readiness.next_actions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ol>
            </section>

            <section className="rounded-xl border border-border/70 bg-background p-6 shadow-sm">
              <h2 className="font-display text-lg">Script preview</h2>
              <p className="mt-1 text-sm text-foreground/60">
                Run <code className="rounded bg-muted px-1">node generate-phase2-payload.mjs</code>{" "}
                for full scoring. Abbreviated/full variants gate HeyGen file writes.
              </p>
              <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-border/60 bg-muted/30 p-4 font-mono text-xs leading-relaxed">
                {script}
              </pre>
            </section>

            <section className="rounded-xl border border-border/70 bg-background p-6 shadow-sm">
              <h2 className="font-display text-lg">Human approval</h2>
              <p className="mt-1 text-sm text-foreground/60">
                Automatic gates must pass for HeyGen payload files. Override only with documented
                reason (minimum 20 characters).
              </p>
              <label className="mt-4 block text-sm">
                <span className="text-foreground/70">Operator notes</span>
                <textarea
                  className="mt-2 w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm"
                  onChange={(e) => setOperatorNote(e.target.value)}
                  placeholder="Document scrape status, SQL apply confirmation, or HeyGen test plan…"
                  rows={4}
                  value={operatorNote}
                />
              </label>
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input
                  checked={operatorApproved}
                  onChange={(e) => setOperatorApproved(e.target.checked)}
                  type="checkbox"
                />
                I confirm operator review for this production week
              </label>
              <p
                className={`mt-4 text-sm font-medium ${
                  canOperatorApprove ? "text-emerald-700" : "text-amber-800"
                }`}
              >
                {readiness.video_ready
                  ? "System gates passed — proceed to generate-phase2-payload.mjs"
                  : canOperatorApprove
                    ? "Manual override recorded — proceed with documented risk"
                    : "Approval blocked — resolve gates or add operator notes (≥20 chars) + checkbox"}
              </p>
            </section>
          </>
        ) : null}
      </main>
    </div>
  )
}
