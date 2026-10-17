import type { PlatformContext, SponsorConfig } from "@/lib/platform-config"

function isPublicSponsor(sponsor: SponsorConfig) {
  if (!sponsor.display_name?.trim()) return false
  if (!sponsor.website_url) return true
  try {
    const url = new URL(sponsor.website_url)
    return ["https:", "http:"].includes(url.protocol) &&
      !/(^|\.)(example\.(com|org|net)|localhost)$/.test(url.hostname)
  } catch {
    return false
  }
}
export function SponsorStrip({ platform }: { platform: PlatformContext }) {
  const weekly = platform.weekly_sponsor && isPublicSponsor(platform.weekly_sponsor) ? platform.weekly_sponsor : null
  const sponsors = (platform.sponsors ?? []).filter(isPublicSponsor)

  if (!weekly && sponsors.length === 0) return null

  return (
    <section className="scroll-mt-24 border-t border-border/50" id="sponsors">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {weekly ? (
          <div className="mb-6 rounded-2xl border border-amber-400/25 bg-gradient-to-r from-amber-500/10 to-sky-500/10 px-5 py-4 sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground/55">
                This week presented by
              </p>
              <p className="mt-1 font-display text-2xl">{weekly.display_name}</p>
              {weekly.category ? (
                <p className="mt-0.5 text-sm text-foreground/60">{weekly.category}</p>
              ) : null}
            </div>
            {weekly.logo_url ? (
              <img
                alt=""
                className="mt-4 h-14 max-w-[180px] object-contain sm:mt-0"
                src={weekly.logo_url}
              />
            ) : null}
          </div>
        ) : null}

        {sponsors.length > 0 ? (
          <div>
            <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-foreground/45">
              Community partners
            </p>
            <ul className="mt-4 flex flex-wrap items-center justify-center gap-3">
              {sponsors.slice(0, 8).map((sponsor) => (
                <li key={sponsor.id}>
                  {sponsor.website_url ? (
                    <a
                      className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-4 py-2 text-sm transition hover:border-border hover:shadow-sm"
                      href={sponsor.website_url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {sponsor.logo_url ? (
                        <img
                          alt=""
                          className="h-6 w-6 rounded object-contain"
                          src={sponsor.logo_url}
                        />
                      ) : null}
                      {sponsor.display_name}
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-4 py-2 text-sm">
                      {sponsor.display_name}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  )
}
