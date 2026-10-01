import type { Certification } from '@/domain/certification/Certification'

/** Where the owner's certifications come from. */
export interface CertificationRepository {
  /** The visible entries, in display order. */
  list(): Promise<Certification[]>
}
