import { useEffect, useState } from "react"
import type { PlatformContext } from "@/lib/platform-config"
import {
  fetchWaterConditions,
  getYouTubeEmbedUrl,
  type WaterConditionsPayload,
} from "@/lib/water-data"

type LakeConditionsSectionProps = {
  platform: PlatformContext
}

export function LakeConditionsSection({ platform }: LakeConditionsSectionProps) {
  const [water, setWater] = useState<WaterConditionsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const cityName = platform.city.display_name

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const data = await fetchWaterConditions()
      if (!cancelled) {
        setWater(data)
        setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const lakes = water?.lakes?.filter((l) => l.temp_f != null) ?? []

  return (
    <section className="scroll-mt-24 border-t border-border/50 bg-background/80" id="lake-conditions">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-800/70 dark:text-sky-300/80">
          Lake conditions
        </p>
        <h2 className="mt-2 font-display text-2xl sm:text-3xl">Water temperature</h2>
        <p className="mt-2 max-w-2xl text-sm text-foreground/65">
          Surface temps from{" "}
          <a
            className="font-medium underline-offset-2 hover:underline"
            href="https://lakemonster.com/"
            rel="noreferrer"
            target="_blank"
          >
            LakeMonster
          </a>{" "}
          — recent readings for {cityName}.
        </p>

        {loading ? (
          <p className="mt-6 text-sm text-foreground/60">Loading lake temperatures…</p>
        ) : lakes.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-border/70 bg-muted/20 px-5 py-8 text-center">
            <p className="text-sm text-foreground/70">
              Current water temperatures are unavailable. Check the source for the latest reading.
            </p>
          </div>
        ) : (
          <>
            {water?.water_temperature_line ? (
              <p className="mt-4 rounded-lg border border-sky-500/25 bg-sky-500/10 px-4 py-3 text-sm font-medium text-foreground/85">
                {water.water_temperature_line}
              </p>
            ) : null}
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lakes.map((lake) => (
                <li key={lake.name}>
                  <a
                    className="block rounded-xl border border-border/70 bg-card p-5 shadow-sm transition hover:border-sky-500/40 hover:shadow-md"
                    href={lake.source_url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <p className="text-sm text-foreground/55">{lake.name}</p>
                    <p className="mt-1 font-display text-3xl">{lake.temp_label}</p>
                    <p className="mt-2 text-xs text-foreground/45">LakeMonster →</p>
                  </a>
                </li>
              ))}
            </ul>
            {water?.fetched_at ? (
              <p className="mt-4 text-xs text-foreground/45">
                Updated {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(water.fetched_at))}
              </p>
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}

type FishingVideoSectionProps = {
  platform: PlatformContext
  fishingVideoUrl: string | null
}

export function FishingVideoSection({
  platform,
  fishingVideoUrl,
}: FishingVideoSectionProps) {
  const cityName = platform.city.display_name
  const embedUrl = fishingVideoUrl ? getYouTubeEmbedUrl(fishingVideoUrl) : null
  const fishing = (platform as PlatformContext & {
    fishing?: {
      enabled?: boolean
      reports?: {
        lake_or_river_name?: string
        bite_rating?: string
        species?: string
        recommended_baits?: string
        report_summary?: string
        water_temp?: string
      }[]
    }
  }).fishing

  const report = fishing?.reports?.[0]
  const reportLine = report
    ? [
        report.lake_or_river_name ? `On ${report.lake_or_river_name}` : null,
        report.bite_rating ? `bite is ${report.bite_rating}` : null,
        report.species ? `target ${report.species}` : null,
        report.water_temp ? `water ${report.water_temp}` : null,
        report.report_summary,
      ]
        .filter(Boolean)
        .join(", ")
    : null

  return (
    <section className="scroll-mt-24 border-t border-border/50" id="fishing">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800/70 dark:text-emerald-300/80">
              Fishing forecast
            </p>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl">Fishing video</h2>
            <p className="mt-2 text-sm text-foreground/65">
              Fishing conditions and local reports for {cityName}.
            </p>

            {reportLine ? (
              <blockquote className="mt-5 border-l-4 border-emerald-500/50 pl-4 text-sm italic text-foreground/75">
                {reportLine}
              </blockquote>
            ) : (
              <p className="mt-5 text-sm text-foreground/55">
                A current fishing report is not available yet.
              </p>
            )}


          </div>

          <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted shadow-lg">
            {embedUrl ? (
              <div className="aspect-video">
                <iframe
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                  src={embedUrl}
                  title={`Fishing forecast — ${cityName}`}
                />
              </div>
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-gradient-to-br from-emerald-950 to-slate-900 px-6 text-center text-white">
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs uppercase tracking-wide">
                  Fishing segment
                </span>
                <p className="font-display text-xl">Fishing forecast video</p>
                <p className="max-w-sm text-sm text-white/70">
                  The next fishing video will appear here when it is ready.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
