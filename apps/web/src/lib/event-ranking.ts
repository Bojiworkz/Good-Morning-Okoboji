import { getSupabaseConfig } from "./supabase"
import type { EventItem } from "./events"
import { buildClientNotesWithManualBoost } from "./ranking-scoring"

export type RankUpdatePayload = {
  rank_score: number
  status: "published" | "rank_manual"
  client_notes?: string | null
  updated_at: string
}

export async function updateEventRank(
  eventId: string,
  rankScore: number,
  options: {
    manual?: boolean
    clientNotes?: string | null
    manualBoost?: number
  } = {}
): Promise<void> {
  const { url, anonKey } = getSupabaseConfig()
  const clamped = Math.max(0, Math.min(100, Math.round(rankScore)))

  const body: RankUpdatePayload = {
    rank_score: clamped,
    status: options.manual ? "rank_manual" : "published",
    updated_at: new Date().toISOString(),
  }

  if (options.manualBoost !== undefined) {
    body.client_notes = buildClientNotesWithManualBoost(
      options.clientNotes ?? null,
      options.manualBoost
    )
  }

  const res = await fetch(`${url}/rest/v1/events?id=eq.${eventId}`, {
    method: "PATCH",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Rank update failed (${res.status}): ${text.slice(0, 200)}`)
  }
}

export async function unlockEventRank(eventId: string): Promise<void> {
  await updateEventRank(eventId, 0, { manual: false })
}

export function mergeRankIntoEvents(
  events: EventItem[],
  eventId: string,
  rankScore: number,
  status: string | null
): EventItem[] {
  return events.map((e) =>
    e.id === eventId
      ? { ...e, rank_score: rankScore, status, updated_at: new Date().toISOString() }
      : e
  )
}
