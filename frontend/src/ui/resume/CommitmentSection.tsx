import type { CommitmentRepository } from '@/domain/commitment/CommitmentRepository'
import { useAsync } from '@/ui/async/useAsync'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { CommitmentTile } from '@/ui/resume/CommitmentTile'
import { ResumeSection } from '@/ui/resume/ResumeSection'
import { HeartIcon } from '@/ui/resume/sectionIcons'

interface CommitmentSectionProps {
  repository: CommitmentRepository
}

export function CommitmentSection({ repository }: CommitmentSectionProps) {
  const text = messages[useLocale().locale]
  const state = useAsync(repository.list)

  return (
    <ResumeSection
      title={text.commitmentsTitle}
      icon={<HeartIcon />}
      state={state}
      variant="row"
      getKey={(commitment) => commitment.id}
      renderTile={(commitment) => <CommitmentTile commitment={commitment} />}
    />
  )
}
