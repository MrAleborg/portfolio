/** When an entry started and ended, as ISO dates (YYYY-MM-DD). */
export interface Period {
  start: string
  /** null while the entry is ongoing. */
  end: string | null
}
