import {
  buildBrandScriptVariables,
  getShowName,
  renderBrandTemplate,
} from "./branding"
import {
  filterWeeklyEvents,
  getWeeklyWindow,
  type EventItem,
} from "./events"
import type { PlatformContext } from "./platform-config"
import { formatEventsList } from "./format-event"

/** HeyGen-ready weekly script from live platform config + events */
export function generateWeeklyScript(
  platform: PlatformContext,
  events: EventItem[],
  referenceDate = new Date()
): string {
  const window = getWeeklyWindow(
    referenceDate,
    platform.brand.week_window_start_dow ?? 4,
    platform.brand.week_window_days ?? 7
  )

  const weeklyEvents = filterWeeklyEvents(events, window)
  const topEvents = weeklyEvents.slice(0, platform.brand.top_events_limit ?? 8)

  const vars = buildBrandScriptVariables(platform, {
    week_label: window.label,
  })

  const introTemplate =
    platform.heygen?.intro_script ||
    platform.brand.heygen_script_intro_template ||
    "Welcome to {{show_name}} for {{city_display_name}}. Here are the top events for {{week_label}}."

  const sponsorTemplate =
    platform.heygen?.sponsor_phrase ||
    platform.weekly_sponsor?.heygen_mention_template ||
    null

  const outroTemplate =
    platform.heygen?.outro_script ||
    "That wraps up this week on {{show_name}}."

  const intro = renderBrandTemplate(introTemplate, vars)
  const sponsor =
    platform.weekly_sponsor && sponsorTemplate
      ? renderBrandTemplate(sponsorTemplate, vars)
      : null
  const outro = renderBrandTemplate(outroTemplate, vars)

  const topBlock =
    topEvents.length === 0
      ? "No events in the current weekly window."
      : formatEventsList(topEvents, { referenceDate })

  const weeklyBlock =
    weeklyEvents.length === 0
      ? "No published events in the weekly window."
      : formatEventsList(weeklyEvents, { referenceDate })

  const showName = getShowName(platform.brand)
  const lines = [
    intro,
    "",
    sponsor,
    "",
    `TOP EVENTS — ${showName}:`,
    topBlock,
    "",
    `ALL EVENTS THIS WEEK — ${showName}:`,
    weeklyBlock,
    "",
    outro,
  ]

  return lines.filter((line): line is string => Boolean(line)).join("\n")
}
