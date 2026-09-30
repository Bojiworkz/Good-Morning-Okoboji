import type { PlatformContext } from "./platform-config"

export type LakeWaterReading = {
  name: string
  temp_f: number | null
  temp_label: string | null
  source: string
  source_url: string
  fetched_at: string
  error?: string
}

export type WaterConditionsPayload = {
  provider: string
  lakes: LakeWaterReading[]
  primary_lake: string | null
  water_temp_f: number | null
  water_temp_label: string | null
  fetched_at: string
  water_temperature_line: string | null
}

export function getFishingVideoUrl(platform: PlatformContext): string | null {
  const publish = platform.brand.social_publish_config
  if (publish && typeof publish === "object") {
    for (const key of [
      "fishing_video_url",
      "latest_fishing_video_url",
      "fishing_episode_url",
    ]) {
      const value = publish[key]
      if (typeof value === "string" && value.trim()) return value.trim()
    }
  }
  const theme = platform.brand.theme
  if (theme && typeof theme === "object") {
    for (const key of ["fishing_video_url", "fishing_heygen_url"]) {
      const value = theme[key]
      if (typeof value === "string" && value.trim()) return value.trim()
    }
  }
  return null
}

export async function fetchWaterConditions(): Promise<WaterConditionsPayload | null> {
  try {
    const res = await fetch("/water-conditions.json", { cache: "no-store" })
    if (!res.ok) return null
    const data = (await res.json()) as WaterConditionsPayload
    const age = Date.now() - Date.parse(data.fetched_at)
    if (!Number.isFinite(age) || age < 0 || age > 24 * 60 * 60 * 1000) return null
    data.lakes = data.lakes.filter((lake) => {
      const lakeAge = Date.now() - Date.parse(lake.fetched_at)
      return Number.isFinite(lakeAge) && lakeAge >= 0 && lakeAge <= 24 * 60 * 60 * 1000
    })
    return data
  } catch {
    return null
  }
}

export function waterTempFromPlatform(platform: PlatformContext): string | null {
  const fishing = platform as PlatformContext & {
    fishing?: { reports?: { water_temp?: string }[] }
    water_data?: { water_temp?: string; temperature_f?: number }
  }
  const reportTemp = fishing.fishing?.reports?.[0]?.water_temp
  if (reportTemp?.trim()) return reportTemp.trim()
  const wd = fishing.water_data
  if (wd?.water_temp) return String(wd.water_temp)
  if (wd?.temperature_f != null) return `${wd.temperature_f}°F`
  return null
}

export function getYouTubeEmbedUrl(videoUrl: string): string | null {
  try {
    const url = new URL(videoUrl)
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.replace("/", "")
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (url.hostname.includes("youtube.com")) {
      const id = url.searchParams.get("v")
      if (id) return `https://www.youtube.com/embed/${id}`
      const parts = url.pathname.split("/")
      const embedIdx = parts.indexOf("embed")
      if (embedIdx >= 0 && parts[embedIdx + 1]) {
        return `https://www.youtube.com/embed/${parts[embedIdx + 1]}`
      }
    }
  } catch {
    return null
  }
  return null
}
