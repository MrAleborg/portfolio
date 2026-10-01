import type { Localized } from '@/domain/i18n/Locale'

export type ScientificCommunicationKind = 'talk' | 'poster' | 'paper' | 'article'

/** A talk, poster or publication. Authors and url are empty when absent. */
export interface ScientificCommunication {
  id: number
  kind: ScientificCommunicationKind
  title: Localized<string>
  authors: string
  venue: string
  /** An ISO date (YYYY-MM-DD). */
  date: string
  url: string
}
