export interface EditorialEvent {
  title: string
  event_date: string
  rank_score?: number | null
  description?: string | null
  location_name?: string | null
  category?: string | null
  source_url?: string | null
  client_notes?: unknown
}
export function classifyEditorialTier(event: EditorialEvent): number
export function selectTopEvents<T extends EditorialEvent>(events: T[], options?: { limit?: number }): {
  selected: (T & { editorial_tier: number; editorial_tier_label: string; event_family: string })[]
}