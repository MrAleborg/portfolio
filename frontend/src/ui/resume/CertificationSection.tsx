import { useCallback } from 'react'
import type { CertificationRepository } from '@/domain/certification/CertificationRepository'
import { groupCredentials } from '@/domain/certification/groupCredentials'
import type { SpecializationRepository } from '@/domain/specialization/SpecializationRepository'
import { useAsync } from '@/ui/async/useAsync'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { CertificationTile } from '@/ui/resume/CertificationTile'
import { ResumeSection } from '@/ui/resume/ResumeSection'
import { SpecializationTile } from '@/ui/resume/SpecializationTile'

interface CertificationSectionProps {
  certificationRepository: CertificationRepository
  specializationRepository: SpecializationRepository
}

/** The specializations, each with its certifications, then the certifications part of none. */
export function CertificationSection({
  certificationRepository,
  specializationRepository,
}: CertificationSectionProps) {
  const text = messages[useLocale().locale]
  const load = useCallback(async () => {
    const [specializations, certifications] = await Promise.all([
      specializationRepository.list(),
      certificationRepository.list(),
    ])
    return groupCredentials(specializations, certifications)
  }, [certificationRepository, specializationRepository])
  const state = useAsync(load)

  return (
    <ResumeSection
      title={text.certificationsTitle}
      state={state}
      getKey={(entry) =>
        entry.kind === 'specialization'
          ? `specialization-${entry.specialization.id}`
          : `certification-${entry.certification.id}`
      }
      renderTile={(entry) =>
        entry.kind === 'specialization' ? (
          <SpecializationTile
            specialization={entry.specialization}
            certifications={entry.certifications}
          />
        ) : (
          <CertificationTile certification={entry.certification} />
        )
      }
    />
  )
}
