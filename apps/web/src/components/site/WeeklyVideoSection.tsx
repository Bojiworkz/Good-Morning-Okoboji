import { useState } from "react"
import { getShowName } from "@/lib/branding"
import { getLatestVideoUrl, getYouTubeEmbedUrl } from "@/lib/social-links"
import type { PlatformContext } from "@/lib/platform-config"

const formats = [
  { id: "short_portrait", label: "Short · Portrait", ratio: "9 / 16" },
  { id: "short_landscape", label: "Short · Landscape", ratio: "16 / 9" },
  { id: "long_portrait", label: "Long · Portrait", ratio: "9 / 16" },
  { id: "long_landscape", label: "Long · Landscape", ratio: "16 / 9" },
] as const

function publicVideoUrl(value: unknown): string | null {
  if (typeof value !== "string") return null
  try {
    const url = new URL(value)
    return url.protocol === "https:" ? url.href : null
  } catch { return null }
}

export function WeeklyVideoSection({ platform }: { platform: PlatformContext }) {
  const [selected, setSelected] = useState<string>(formats[0].id)
  const format = formats.find((item) => item.id === selected) ?? formats[0]
  const raw = platform.brand.social_publish_config?.video_variants
  const variants = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {}
  const videoUrl = publicVideoUrl(variants[format.id])
  const embedUrl = videoUrl ? getYouTubeEmbedUrl(videoUrl) : null
  const isMp4 = videoUrl ? new URL(videoUrl).pathname.toLowerCase().endsWith(".mp4") : false
  const legacyUrl = publicVideoUrl(getLatestVideoUrl(platform))
  const showName = getShowName(platform.brand)
  return (
    <section id="weekly-video" className="scroll-mt-24 border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-xs uppercase tracking-[0.2em] text-foreground/60">Watch the show</p>
        <h2 className="mt-2 font-display text-3xl">{showName}</h2>
        <p className="mt-3 text-sm text-foreground/70">Choose a quick update or the full episode, sized for your screen.</p>
        <div aria-label="Video format" className="my-6 flex flex-wrap gap-2">
          {formats.map((item) => <button key={item.id} type="button" aria-pressed={selected === item.id} onClick={() => setSelected(item.id)} className={`rounded-xl border px-4 py-3 text-sm ${selected === item.id ? "bg-slate-900 text-white" : "bg-background hover:bg-muted"}`}>{item.label}</button>)}
        </div>
        <div className="max-w-3xl rounded-2xl border border-border bg-muted/30 p-5">
          <h3 className="mb-4 font-display text-xl">{format.label}</h3>
          {videoUrl ? (
            <>
              {(embedUrl || isMp4) && <div className="mx-auto overflow-hidden rounded-xl bg-slate-950" style={{ aspectRatio: format.ratio, maxHeight: "70vh" }}>
                {embedUrl ? <iframe src={embedUrl} title={`${showName} — ${format.label}`} className="h-full w-full" allowFullScreen /> : <video src={videoUrl} controls playsInline preload="metadata" className="h-full w-full object-contain">Your browser does not support embedded video.</video>}
              </div>}
              <a className="mt-4 inline-block font-semibold underline underline-offset-4" href={videoUrl} target="_blank" rel="noreferrer">Open {format.label.toLowerCase()} ↗</a>
            </>
          ) : <div role="status" className="rounded-xl bg-slate-900 px-6 py-12 text-center text-white"><p className="font-display text-xl">This version is not available yet.</p><p className="mt-3 text-sm text-white/75">Explore the current events while the next episode is prepared.</p><a className="mt-5 inline-block text-sm font-semibold underline" href="#/upcoming-events">Browse upcoming events →</a></div>}
          {legacyUrl && <a className="mt-5 inline-block text-sm underline" href={legacyUrl} target="_blank" rel="noreferrer">Open previously published video ↗</a>}
        </div>
      </div>
    </section>
  )
}
