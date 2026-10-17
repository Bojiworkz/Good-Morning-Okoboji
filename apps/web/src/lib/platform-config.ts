import { getShowName } from "./branding"
import { getSupabaseConfig } from "./supabase"

/** brand_config identity — brand_slug is internal only */
export type BrandConfig = {
  id: string
  brand_slug: string
  /** @deprecated legacy column — normalized to brand_slug on fetch */
  slug?: string
  brand_name: string
  show_name: string
  short_name: string | null
  tagline: string | null
  city_config_id: string
  public_site_url: string | null
  website_url: string | null
  events_page_title: string
  top_events_section_title: string
  weekly_events_section_title: string
  top_events_limit: number
  week_window_start_dow: number
  week_window_days: number
  theme: Record<string, unknown>
  logo_url?: string | null
  heygen_template_id: string | null
  heygen_avatar_id: string | null
  heygen_avatar_gender: string | null
  heygen_host_label: string | null
  heygen_script_intro_template: string | null
  youtube_channel_id: string | null
  social_publish_config: Record<string, unknown>
}

export type CityConfig = {
  id: string
  slug: string
  display_name: string
  state: string
  country: string
  timezone: string
  zip_center: string | null
  default_radius_miles: number
}

export type SponsorConfig = {
  id: string
  slug: string
  display_name: string
  category: string | null
  logo_url?: string | null
  website_url?: string | null
  sponsor_role: string
  heygen_mention_template: string | null
  social_mention_template: string | null
  is_weekly_featured: boolean
}

export type HeygenConfig = {
  brand_config_id: string
  template_id: string | null
  avatar_id: string | null
  voice_id: string | null
  host_name: string | null
  host_gender: string | null
  intro_phrase: string | null
  sponsor_phrase: string | null
  closing_phrase: string | null
  intro_script: string | null
  outro_script: string | null
}

export type SocialConfig = {
  brand_config_id: string
  youtube_channel_id: string | null
  facebook_page_id: string | null
  instagram_account_id: string | null
  tiktok_account_id: string | null
  linkedin_page_id: string | null
}

export type PublicBrand = {
  show_name: string
  brand_name: string
  short_name: string | null
  tagline: string | null
  events_page_title: string
  youtube_title_prefix: string
}

export type WeekContext = {
  week_start: string
  week_end: string
}

export type PlatformContext = {
  brand: BrandConfig
  public_brand?: PublicBrand
  city: CityConfig & { resolved_radius_miles?: number }
  heygen: HeygenConfig | null
  social: SocialConfig | null
  event_sources: unknown[]
  sources: unknown[]
  sponsors: SponsorConfig[]
  weekly_sponsor: SponsorConfig | null
  week_context?: WeekContext | null
}

/** Env-only internal brand_slug (may contain dashes) */
export function getBrandSlug(): string {
  const slug = import.meta.env.VITE_PLATFORM_BRAND_SLUG as string | undefined
  if (!slug?.trim()) {
    throw new Error(
      "Missing VITE_PLATFORM_BRAND_SLUG — brand_config.brand_slug (e.g. good-morning-okoboji)"
    )
  }
  return slug.trim().toLowerCase()
}

export async function fetchPlatformContext(): Promise<PlatformContext> {
  const { url, anonKey } = getSupabaseConfig()
  const brandSlug = getBrandSlug()
  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/rpc/get_platform_context`

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_brand_slug: brandSlug }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(
      `Platform config failed (${response.status}). Apply platform SQL first: 02-Supabase/apply_all_manual.sql (see FIX_PLATFORM.md). brand_slug: "${brandSlug}". ${body.slice(0, 160)}`
    )
  }

  const data = (await response.json()) as PlatformContext
  if (!data?.brand || !data?.city?.id) {
    throw new Error("Invalid platform context response from Supabase")
  }

  if (!data.brand.brand_slug && data.brand.slug) {
    data.brand.brand_slug = data.brand.slug
  }

  const showName = getShowName(data.brand)
  if (!showName || showName.includes("-")) {
    throw new Error(
      "brand_config.show_name must be set (Title Case, no dashes). brand_slug is internal only."
    )
  }

  return data
}
