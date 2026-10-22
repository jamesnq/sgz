const STORAGE_KEY = 'sgz:recently-viewed'
export const RECENTLY_VIEWED_LIMIT = 12

type Entry = { id: number; viewedAt: number }

const readEntries = (): Entry[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (e): e is Entry => Number.isInteger(e?.id) && e.id > 0 && typeof e?.viewedAt === 'number',
    )
  } catch {
    return []
  }
}

/** Product ids, most recently viewed first. */
export const getRecentlyViewedIds = (): number[] => readEntries().map((e) => e.id)

export const addRecentlyViewed = (id: number) => {
  try {
    const entries = readEntries().filter((e) => e.id !== id)
    entries.unshift({ id, viewedAt: Date.now() })
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(entries.slice(0, RECENTLY_VIEWED_LIMIT)),
    )
  } catch {
    // Storage unavailable (private mode, quota): feature silently degrades
  }
}
