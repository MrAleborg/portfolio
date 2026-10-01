import type { Certification } from '@/domain/certification/Certification'
import { LabelledList } from '@/ui/components/LabelledList'
import { TagList } from '@/ui/components/TagList'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { CredentialTile } from '@/ui/resume/CredentialTile'

interface CertificationTileProps {
  certification: Certification
}

export function CertificationTile({ certification }: CertificationTileProps) {
  const { locale } = useLocale()

  return (
    <CredentialTile credential={certification}>
      {certification.specializations.length > 0 ? (
        <LabelledList
          label={messages[locale].partOf}
          items={certification.specializations.map((specialization) => specialization.name[locale])}
        />
      ) : null}
      {certification.tags.length > 0 ? <TagList tags={certification.tags} /> : null}
    </CredentialTile>
  )
}
