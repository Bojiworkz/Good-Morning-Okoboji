/**
 * Editorial ranking — entertainment-first Top N selection (Phase 1).
 * Authority: 05-Documentation/EDITORIAL_PRIORITY_STANDARD.md
 */

const HTML_ENTITIES = {
  "&amp;": "&",
  "&quot;": '"',
  "&nbsp;": " ",
  "&#39;": "'",
  "&rsquo;": "'",
  "&ldquo;": '"',
  "&rdquo;": '"',
  "&ndash;": "-",
  "&#8211;": "-",
  "&#8212;": "-",
  "&#8217;": "'",
};

/** Tier 1 = highest priority. First matching tier wins. */
const TIER_RULES = [
  {
    tier: 1,
    label: "arnolds_park_concert",
    patterns: [
      /live at the lake/i,
      /roof garden/i,
      /arnolds park/i,
      /chubby checker/i,
      /yachty by nature/i,
      /linda ronstadt/i,
    ],
  },
  {
    tier: 2,
    label: "captains_getaway_live_music",
    patterns: [
      /captain'?s getaway/i,
      /captains getaway/i,
      /barefoot bar/i,
      /little swan/i,
      /\bband @/i,
      /live music by/i,
      /live music @/i,
      /@ barefoot/i,
    ],
  },
  {
    tier: 3,
    label: "major_festival",
    patterns: [/festival/i, /biggest summer party/i, /party series/i, /\bfair\b/i],
  },
  {
    tier: 4,
    label: "signature_community",
    patterns: [/birthday bash/i, /fireworks/i, /boots n.? bling/i, /pre-?season gala/i],
  },
  {
    tier: 5,
    label: "major_theatre",
    patterns: [
      /ring of fire/i,
      /murder on the links/i,
      /sister act/i,
      /okoboji summer theatre/i,
      /\btheatre\b/i,
      /\btheater\b/i,
    ],
  },
  {
    tier: 6,
    label: "brewery_winery",
    patterns: [/brewery/i, /beer run/i, /winery/i, /west o beer/i, /taproom/i],
  },
  {
    tier: 7,
    label: "family",
    patterns: [/family/i, /\bkids\b/i, /children/i, /movies at/i],
  },
  {
    tier: 8,
    label: "outdoor_charity",
    patterns: [
      /freedom rock run/i,
      /\b5k\b/i,
      /cycling classic/i,
      /benefit for/i,
      /charity/i,
      /\bgolf\b/i,
    ],
  },
  {
    tier: 9,
    label: "educational",
    patterns: [/storytime/i, /book club/i, /maker monday/i, /library/i, /workshop/i, /\bclass\b/i],
  },
  {
    tier: 10,
    label: "meetings_clubs",
    patterns: [/meeting/i, /committee/i, /kiwanis/i, /rotary/i, /board meeting/i],
  },
];

const GENERIC_TITLE_PATTERNS = [
  /^okoboji summer theatre$/i,
  /^west o beer$/i,
  /^okoboji$/i,
];

export function decodeHtmlEntities(text) {
  let out = String(text || "");
  for (const [entity, char] of Object.entries(HTML_ENTITIES)) {
    out = out.split(entity).join(char);
  }
  return out.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

export function normalizeEventFamily(title) {
  let t = decodeHtmlEntities(title).toLowerCase().trim();
  t = t.replace(/\s*[–—-]\s*\d{1,2}(:\d{2})?\s*(am|pm)\s*show\s*$/i, "");
  t = t.replace(/\s*,\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}/gi, "");
  t = t.replace(/\s*,\s*(mon|tue|wed|thu|fri|sat|sun)[a-z]*\s+\d{1,2}(:\d{2})?\s*(am|pm)?/gi, "");
  t = t.replace(/\s*@\s+[^,]+$/i, "");
  t = t.replace(/\s*\|\s*.+$/, "");
  t = t.replace(/\s+/g, " ").trim();
  return t || null;
}

function buildSearchBlob(event) {
  return decodeHtmlEntities(
    [event.title, event.description, event.location_name, event.category, event.source_url]
      .filter(Boolean)
      .join(" ")
  ).toLowerCase();
}

export function isGenericPlaceholder(event) {
  const title = decodeHtmlEntities(event.title || "").trim();
  if (!title) return true;
  if (GENERIC_TITLE_PATTERNS.some((re) => re.test(title))) return true;
  if (title.length < 4) return true;
  return false;
}

export function classifyEditorialTier(event) {
  const notes = event.client_notes;
  if (notes && typeof notes === "object" && notes.editorial_tier != null) {
    return Number(notes.editorial_tier);
  }
  const blob = buildSearchBlob(event);
  for (const rule of TIER_RULES) {
    if (rule.patterns.some((re) => re.test(blob))) {
      return rule.tier;
    }
  }
  return 7;
}

export function getEditorialTierLabel(tier) {
  return TIER_RULES.find((r) => r.tier === tier)?.label ?? "unclassified";
}

export function getQualityScore(event) {
  return Number(event.rank_score) || 0;
}

/** Strongest-headline boost within tier 1–3 (national headliner > tribute > date order). */
const HEADLINE_SCORES = [
  { pattern: /chubby checker/i, score: 100 },
  { pattern: /linda ronstadt/i, score: 90 },
  { pattern: /biggest summer party|party series/i, score: 85 },
  { pattern: /yachty by nature/i, score: 70 },
  { pattern: /live at the lake/i, score: 65 },
  { pattern: /roof garden/i, score: 65 },
  { pattern: /captain'?s getaway/i, score: 60 },
  { pattern: /barefoot bar/i, score: 55 },
];

export function getHeadlineScore(event) {
  const blob = buildSearchBlob(event);
  for (const rule of HEADLINE_SCORES) {
    if (rule.pattern.test(blob)) return rule.score;
  }
  const tier = classifyEditorialTier(event);
  if (tier === 1) return 50;
  if (tier === 2) return 45;
  if (tier === 3) return 40;
  return 0;
}

function parsePerformanceMinutes(title) {
  const t = decodeHtmlEntities(title);
  const m = t.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (!m) return null;
  let hours = Number(m[1]);
  const minutes = Number(m[2] ?? 0);
  const meridiem = m[3].toUpperCase();
  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function dayOfWeek(eventDate) {
  return new Date(`${eventDate}T12:00:00`).getDay();
}

/** Saturday = 0, Friday = 1, Sunday = 2, other = 3+ */
function weekendPreference(eventDate) {
  const d = dayOfWeek(eventDate);
  if (d === 6) return 0;
  if (d === 5) return 1;
  if (d === 0) return 2;
  return 3 + d;
}

export function compareEditorialEvents(a, b) {
  const tierA = classifyEditorialTier(a);
  const tierB = classifyEditorialTier(b);
  if (tierA !== tierB) return tierA - tierB;

  const hA = getHeadlineScore(a);
  const hB = getHeadlineScore(b);
  if (hA !== hB) return hB - hA;

  const qA = getQualityScore(a);
  const qB = getQualityScore(b);
  if (qA !== qB) return qB - qA;

  const dateCmp = String(a.event_date).localeCompare(String(b.event_date));
  if (dateCmp !== 0) return dateCmp;

  const wA = weekendPreference(a.event_date);
  const wB = weekendPreference(b.event_date);
  if (wA !== wB) return wA - wB;

  const tA = parsePerformanceMinutes(a.title) ?? 0;
  const tB = parsePerformanceMinutes(b.title) ?? 0;
  return tB - tA;
}

export function pickStrongestHeadline(events) {
  const pool = (events || []).filter(
    (e) => !isGenericPlaceholder(e) && classifyEditorialTier(e) <= 3
  );
  if (!pool.length) return null;
  return [...pool].sort((a, b) => {
    const hs = getHeadlineScore(b) - getHeadlineScore(a);
    if (hs !== 0) return hs;
    return compareEditorialEvents(a, b);
  })[0];
}

export function sortEditorialPool(events) {
  return [...events]
    .filter((e) => !isGenericPlaceholder(e))
    .sort(compareEditorialEvents);
}

/**
 * Greedy Top N with one event per production family.
 */
export function selectTopEvents(events, { limit = 5 } = {}) {
  const sorted = sortEditorialPool(events);
  const selected = [];
  const seenFamilies = new Set();

  for (const event of sorted) {
    const family = normalizeEventFamily(event.title);
    if (!family || seenFamilies.has(family)) continue;
    seenFamilies.add(family);
    selected.push({
      ...event,
      editorial_tier: classifyEditorialTier(event),
      editorial_tier_label: getEditorialTierLabel(classifyEditorialTier(event)),
      event_family: family,
    });
    if (selected.length >= limit) break;
  }

  return {
    selected,
    sorted_pool_size: sorted.length,
    families_considered: sorted.map((e) => ({
      title: e.title,
      family: normalizeEventFamily(e.title),
      tier: classifyEditorialTier(e),
      rank_score: getQualityScore(e),
    })),
  };
}

/** Legacy rank_score-only Top N (no family dedupe) — for before/after reports. */
export function selectTopByRankScore(events, { limit = 10 } = {}) {
  return [...events]
    .sort((a, b) => {
      const rs = getQualityScore(b) - getQualityScore(a);
      if (rs !== 0) return rs;
      return String(a.event_date).localeCompare(String(b.event_date));
    })
    .slice(0, limit);
}

export function formatEditorialRow(event, index) {
  return {
    rank: index + 1,
    title: decodeHtmlEntities(event.title),
    event_date: event.event_date,
    location_name: event.location_name,
    rank_score: getQualityScore(event),
    editorial_tier: event.editorial_tier ?? classifyEditorialTier(event),
    event_family: event.event_family ?? normalizeEventFamily(event.title),
  };
}
