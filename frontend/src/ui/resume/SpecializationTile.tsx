import type { Specialization } from '@/domain/specialization/Specialization'
import { LabelledList } from '@/ui/components/LabelledList'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { CredentialTile } from '@/ui/resume/CredentialTile'

interface SpecializationTileProps {
  specialization: Specialization
}

export function SpecializationTile({ specialization }: SpecializationTileProps) {
  const { locale } = useLocale()

  return (
    <CredentialTile credential={specialization}>
      {specialization.certifications.length > 0 ? (
        <LabelledList
          label={messages[locale].certificationsTitle}
          items={specialization.certifications.map((certification) => certification.name[locale])}
        />
      ) : null}
    </CredentialTile>
  )
}
