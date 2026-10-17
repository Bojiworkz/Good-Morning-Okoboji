import type { PlatformContext } from "./platform-config"

export type SocialLink = {
  id: string
  label: string
  href: string
}

function youtubeChannelUrl(channelId: string) {
  return `https://www.youtube.com/channel/${channelId}`
}

function facebookPageUrl(pageId: string) {
  return pageId.startsWith("http") ? pageId : `https://www.facebook.com/${pageId}`
}

function instagramUrl(accountId: string) {
  const handle = accountId.replace(/^@/, "")
  return `https://www.instagram.com/${handle}/`
}

export function getLatestVideoUrl(platform: PlatformContext): string | null {
  const publish = platform.brand.social_publish_config
  if (publish && typeof publish === "object") {
    for (const key of ["latest_video_url", "latest_episode_url", "youtube_url"]) {
      const value = publish[key]
      if (typeof value === "string" && value.trim()) return value.trim()
    }
  }

  const theme = platform.brand.theme
  if (theme && typeof theme === "object") {
    for (const key of ["latest_video_url", "hero_video_url"]) {
      const value = theme[key]
      if (typeof value === "string" && value.trim()) return value.trim()
    }
  }

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

export function getSocialLinks(platform: PlatformContext): SocialLink[] {
  const links: SocialLink[] = []
  const social = platform.social
  const brand = platform.brand

  const youtubeId =
    social?.youtube_channel_id?.trim() ||
    brand.youtube_channel_id?.trim() ||
    ""
  if (youtubeId) {
    links.push({
      id: "youtube",
      label: "YouTube",
      href: youtubeChannelUrl(youtubeId),
    })
  }

  if (social?.facebook_page_id?.trim()) {
    links.push({
      id: "facebook",
      label: "Facebook",
      href: facebookPageUrl(social.facebook_page_id.trim()),
    })
  }

  if (social?.instagram_account_id?.trim()) {
    links.push({
      id: "instagram",
      label: "Instagram",
      href: instagramUrl(social.instagram_account_id.trim()),
    })
  }

  if (social?.tiktok_account_id?.trim()) {
    const handle = social.tiktok_account_id.trim().replace(/^@/, "")
    links.push({
      id: "tiktok",
      label: "TikTok",
      href: `https://www.tiktok.com/@${handle}`,
    })
  }

  const website =
    brand.website_url?.trim() || brand.public_site_url?.trim() || ""
  if (website) {
    links.push({ id: "website", label: "Website", href: website })
  }

  return links
}
