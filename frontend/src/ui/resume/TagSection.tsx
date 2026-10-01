import type { TagRepository } from '@/domain/tag/TagRepository'
import { useAsync } from '@/ui/async/useAsync'
import { TagList } from '@/ui/components/TagList'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { ResumeSection } from '@/ui/resume/ResumeSection'
import './TagSection.css'

interface TagSectionProps {
  repository: TagRepository
}

export function TagSection({ repository }: TagSectionProps) {
  const text = messages[useLocale().locale]
  const state = useAsync(repository.list)

  return (
    <ResumeSection
      title={text.expertiseTitle}
      state={state}
      renderItems={(tags) => (
        <div className="tag-summary">
          <TagList tags={tags} />
        </div>
      )}
    />
  )
}
