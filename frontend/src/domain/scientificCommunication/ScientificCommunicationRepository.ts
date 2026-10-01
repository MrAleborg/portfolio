import type { ScientificCommunication } from '@/domain/scientificCommunication/ScientificCommunication'

/** Where the owner's scientific communications come from. */
export interface ScientificCommunicationRepository {
  /** The visible entries, in display order. */
  list(): Promise<ScientificCommunication[]>
}
