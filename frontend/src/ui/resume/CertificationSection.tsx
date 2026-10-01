import type { CertificationRepository } from '@/domain/certification/CertificationRepository'
import { useAsync } from '@/ui/async/useAsync'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { CertificationTile } from '@/ui/resume/CertificationTile'
import { ResumeSection } from '@/ui/resume/ResumeSection'

interface CertificationSectionProps {
  repository: CertificationRepository
}

export function CertificationSection({ repository }: CertificationSectionProps) {
  const text = messages[useLocale().locale]
  const state = useAsync(repository.list)

  return (
    <ResumeSection
      title={text.certificationsTitle}
      state={state}
      getKey={(certification) => certification.id}
      renderTile={(certification) => <CertificationTile certification={certification} />}
    />
  )
}
