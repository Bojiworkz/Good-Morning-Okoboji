import type { BrandConfig, CityConfig, PlatformContext } from "./platform-config"

/**
 * Internal slugs (e.g. good-morning-okoboji) must never appear in UI,
 * HeyGen speech, social posts, or YouTube titles.
 */

function assertNoDashesInPublicName(value: string, field: string) {
  if (value.includes("-")) {
    console.warn(
      `[branding] ${field} contains dashes — use Title Case words only: "${value}"`
    )
  }
}

/** Public show name for headers, HeyGen, social, YouTube */
export function getShowName(brand: BrandConfig): string {
  const name = brand.show_name?.trim() || brand.brand_name?.trim() || ""
  if (!name) return "Weekly Events"
  assertNoDashesInPublicName(name, "show_name")
  return name
}

export function getShortName(brand: BrandConfig): string {
  return brand.short_name?.trim() || ""
}

export function getTagline(brand: BrandConfig): string {
  return brand.tagline?.trim() || ""
}

/** Marketing / footer brand line */
export function getBrandName(brand: BrandConfig): string {
  const name = brand.brand_name?.trim() || getShowName(brand)
  assertNoDashesInPublicName(name, "brand_name")
  return name
}

export function getCityDisplayName(city: CityConfig): string {
  return city.display_name?.trim() || ""
}

/** Variables for HeyGen / social templates — never includes slug */
export function buildBrandScriptVariables(
  platform: PlatformContext,
  extras?: Record<string, string>
): Record<string, string> {
  const showName = getShowName(platform.brand)
  const brandName = getBrandName(platform.brand)
  const cityName = getCityDisplayName(platform.city)

  return {
    show_name: showName,
    brand_name: brandName,
    short_name: getShortName(platform.brand),
    tagline: getTagline(platform.brand),
    brand_display_name: brandName,
    city_display_name: cityName,
    sponsor_display_name:
      platform.weekly_sponsor?.display_name?.trim() ?? "",
    website_url:
      platform.brand.website_url?.trim() ||
      platform.brand.public_site_url?.trim() ||
      "",
    ...extras,
  }
}

/** Replace {{placeholders}} in config templates */
export function renderBrandTemplate(
  template: string | null | undefined,
  vars: Record<string, string>
): string {
  if (!template) return ""
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "")
}
