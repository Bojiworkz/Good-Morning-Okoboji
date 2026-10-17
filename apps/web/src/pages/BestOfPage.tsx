import { useEffect, useState } from "react"
import { SiteFooter, SiteHeader } from "@/components/site/SiteHeader"
import type { PlatformContext } from "@/lib/platform-config"
import { setPageMeta } from "@/lib/site-meta"

const guides = [
  { title: "Find your next favorite meal", category: "Food & drink", detail: "Explore restaurants, waterfront dining, breweries, and wineries in the area's tourism directory.", href: "https://vacationokoboji.com/eat-and-drink/", label: "Explore food & drink", source: "Vacation Okoboji", color: "from-amber-100 to-orange-50" },
  { title: "Make a day of it together", category: "Family", detail: "Browse attractions and family adventures, then check the venue's seasonal hours before you go.", href: "https://vacationokoboji.com/things-to-do/attractions/", label: "Explore attractions", source: "Vacation Okoboji", color: "from-emerald-100 to-teal-50" },
  { title: "Spend some time lakeside", category: "Outdoors", detail: "Find beaches, parks, trails, fishing, and recreation resources for your next lake day.", href: "https://vacationokoboji.com/things-to-do/", label: "Explore the outdoors", source: "Vacation Okoboji", color: "from-sky-100 to-blue-50" },
  { title: "See what's on the calendar", category: "Entertainment", detail: "Check the destination calendar for dated events and confirm admission and availability with the organizer.", href: "https://vacationokoboji.com/events/", label: "Open destination calendar", source: "Vacation Okoboji", color: "from-violet-100 to-indigo-50" },
]
const categories = ["All", "Food & drink", "Family", "Outdoors", "Entertainment"]

export function BestOfPage({ platform }: { platform: PlatformContext }) {
  const [category, setCategory] = useState("All")
  const [query, setQuery] = useState("")
  useEffect(() => {
    setPageMeta({ title: "Best Of Okoboji — Explore the Iowa Great Lakes", description: "Plan your Okoboji visit with food, family, outdoor and entertainment resources from the local tourism organization." })
  }, [])
  const filtered = guides.filter((guide) => (category === "All" || category === guide.category) && `${guide.title} ${guide.category} ${guide.detail}`.toLowerCase().includes(query.toLowerCase().trim()))
  return (
    <div className="min-h-svh bg-[#faf7f2] text-foreground">
      <SiteHeader platform={platform} />
      <main id="best-of" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <section className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-12 text-white sm:px-12 sm:py-16">
          <div aria-hidden="true" className="absolute -right-16 -top-24 h-80 w-80 rounded-full border-[36px] border-sky-300/10" />
          <p className="relative text-xs font-semibold uppercase tracking-[0.25em] text-sky-200">A Good Morning Okoboji companion</p>
          <h1 className="relative mt-4 font-display text-4xl sm:text-6xl">Best Of Okoboji</h1>
          <p className="relative mt-5 max-w-xl text-xl text-white/85">Find your kind of lake day.</p>
          <p className="relative mt-3 max-w-xl text-sm leading-7 text-white/70">Good food. Time together. A little adventure. Start exploring the Iowa Great Lakes with local planning resources.</p>
          <a className="relative mt-7 inline-flex rounded-xl bg-amber-300 px-5 py-3 font-semibold text-slate-950 hover:bg-amber-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" href="#/upcoming-events">See upcoming events →</a>
        </section>
        <section aria-labelledby="explore-title" className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div><p className="text-xs uppercase tracking-[0.2em] text-sky-800">Explore by interest</p><h2 id="explore-title" className="mt-2 font-display text-3xl">What sounds good today?</h2></div>
            <label className="grid gap-2 text-sm">Search the guide<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} className="rounded-xl border border-border bg-white px-4 py-3" placeholder="Food, trails, family…" /></label>
          </div>
          <div className="my-6 flex flex-wrap gap-2" aria-label="Filter guide categories">
            {categories.map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} className={`rounded-full border px-4 py-2 text-sm ${category === item ? "border-slate-900 bg-slate-900 text-white" : "border-border bg-white hover:bg-sky-50"}`}>{item}</button>)}
          </div>
          <p className="sr-only" role="status">{filtered.length} planning {filtered.length === 1 ? "resource" : "resources"}</p>
          <div className="grid gap-5 md:grid-cols-2">
            {filtered.map((guide) => <article key={guide.category} className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              <div className={`bg-gradient-to-br ${guide.color} px-6 py-8`}><p className="text-xs font-semibold uppercase tracking-widest text-slate-700">{guide.category}</p><h3 className="mt-3 font-display text-2xl text-slate-900">{guide.title}</h3></div>
              <div className="space-y-4 p-6"><p className="text-sm leading-6 text-foreground/75">{guide.detail}</p><a href={guide.href} target="_blank" rel="noreferrer" className="inline-block font-semibold text-sky-800 underline decoration-sky-200 underline-offset-4 hover:decoration-sky-800">{guide.label} ↗</a><p className="text-xs text-foreground/60">Source: {guide.source} · Resource checked September 29, 2026</p></div>
            </article>)}
          </div>
          {filtered.length === 0 && <div className="rounded-xl border border-dashed border-border p-8 text-center"><p>No resources match those filters.</p><button type="button" onClick={() => { setQuery(""); setCategory("All") }} className="mt-3 font-semibold text-sky-800 underline">Clear filters</button></div>}
        </section>
        <section aria-labelledby="guide-standard" className="mt-10 rounded-2xl border border-border bg-white p-6 sm:p-8">
          <h2 id="guide-standard" className="font-display text-2xl">A useful guide starts with trustworthy information.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-foreground/75">This first edition connects you with local tourism resources. Individual Best Of selections are still under review, and reader voting has not opened. Check each business or organizer for current hours, prices, and availability.</p>
          <a href="https://vacationokoboji.com/visitor-guide/" target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-semibold text-sky-800 underline underline-offset-4">Browse the official visitor guide ↗</a>
        </section>
      </main>
      <SiteFooter platform={platform} />
    </div>
  )
}
