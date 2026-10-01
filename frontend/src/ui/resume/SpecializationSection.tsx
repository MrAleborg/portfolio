import type { SpecializationRepository } from '@/domain/specialization/SpecializationRepository'
import { useAsync } from '@/ui/async/useAsync'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { SpecializationTile } from '@/ui/resume/SpecializationTile'
import { ResumeSection } from '@/ui/resume/ResumeSection'

interface SpecializationSectionProps {
  repository: SpecializationRepository
}

export function SpecializationSection({ repository }: SpecializationSectionProps) {
  const text = messages[useLocale().locale]
  const state = useAsync(repository.list)

  return (
    <ResumeSection
      title={text.specializationsTitle}
      state={state}
      getKey={(specialization) => specialization.id}
      renderTile={(specialization) => <SpecializationTile specialization={specialization} />}
    />
  )
}
