import type { Commitment } from '@/domain/commitment/Commitment'

/** Where the owner's commitments come from. */
export interface CommitmentRepository {
  /** The visible entries, in display order. */
  list(): Promise<Commitment[]>
}
