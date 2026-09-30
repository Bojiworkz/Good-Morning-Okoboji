import type { BrandConfig } from "./platform-config"

export type BrandTheme = {
  logoUrl: string | null
  accentColor: string | null
  heroImageUrl: string | null
}

export function getBrandTheme(brand: BrandConfig): BrandTheme {
  const theme = brand.theme && typeof brand.theme === "object" ? brand.theme : {}
  const logoUrl =
    (brand as BrandConfig & { logo_url?: string | null }).logo_url?.trim() ||
    (typeof theme.logo_url === "string" ? theme.logo_url.trim() : "") ||
    null
  const accentColor =
    typeof theme.accent_color === "string" ? theme.accent_color : null
  const heroImageUrl =
    typeof theme.hero_image_url === "string" ? theme.hero_image_url : null

  return { logoUrl, accentColor, heroImageUrl }
}
