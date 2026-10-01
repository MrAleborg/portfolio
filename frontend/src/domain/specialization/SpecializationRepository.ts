import type { Specialization } from '@/domain/specialization/Specialization'

/** Where the owner's specializations come from. */
export interface SpecializationRepository {
  /** The visible entries, in display order. */
  list(): Promise<Specialization[]>
}
