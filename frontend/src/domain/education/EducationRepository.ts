import type { Education } from '@/domain/education/Education'

/** Where the owner's education comes from. */
export interface EducationRepository {
  /** The visible entries, in display order. */
  list(): Promise<Education[]>
}
