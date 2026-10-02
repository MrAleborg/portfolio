import type { Certification } from '@/domain/certification/Certification'
import type { Specialization } from '@/domain/specialization/Specialization'
import { LabelledList } from '@/ui/components/LabelledList'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { CertificationTile } from '@/ui/resume/CertificationTile'
import { CredentialTile } from '@/ui/resume/CredentialTile'

interface SpecializationTileProps {
  specialization: Specialization
  /** The certifications it is made of, shown as tiles inside it. */
  certifications: Certification[]
}

export function SpecializationTile({ specialization, certifications }: SpecializationTileProps) {
  const text = messages[useLocale().locale]

  return (
    <CredentialTile credential={specialization}>
      {certifications.length > 0 ? (
        <LabelledList
          label={text.certificationsTitle}
          className="experience-projects"
          items={certifications.map((certification) => (
            <CertificationTile certification={certification} headingLevel={4} />
          ))}
        />
      ) : null}
    </CredentialTile>
  )
}
