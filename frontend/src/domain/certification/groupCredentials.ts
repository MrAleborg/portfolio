import type { Certification } from '@/domain/certification/Certification'
import type { Specialization } from '@/domain/specialization/Specialization'

/** What the Certifications section lists: a specialization with its certifications, or a certification on its own. */
export type CredentialEntry =
  | { kind: 'specialization'; specialization: Specialization; certifications: Certification[] }
  | { kind: 'certification'; certification: Certification }

/**
 * Nests each certification under the specializations that list it. Lists the
 * specializations first, then the certifications no specialization lists,
 * each in input order.
 */
export function groupCredentials(
  specializations: Specialization[],
  certifications: Certification[],
): CredentialEntry[] {
  const byId = new Map(certifications.map((certification) => [certification.id, certification]))
  const nestedIds = new Set(
    specializations.flatMap(({ certifications }) => certifications.map(({ id }) => id)),
  )

  return [
    ...specializations.map((specialization) => ({
      kind: 'specialization' as const,
      specialization,
      certifications: specialization.certifications.flatMap(({ id }) => byId.get(id) ?? []),
    })),
    ...certifications
      .filter(({ id }) => !nestedIds.has(id))
      .map((certification) => ({ kind: 'certification' as const, certification })),
  ]
}
