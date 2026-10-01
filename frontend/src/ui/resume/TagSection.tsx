import { useCallback } from 'react'
import { visibleDomains } from '@/domain/tag/TagCategory'
import type { TagRepository } from '@/domain/tag/TagRepository'
import { useAsync } from '@/ui/async/useAsync'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { DomainTile } from '@/ui/resume/DomainTile'
import { ResumeSection } from '@/ui/resume/ResumeSection'

interface TagSectionProps {
  repository: TagRepository
}

export function TagSection({ repository }: TagSectionProps) {
  const text = messages[useLocale().locale]
  const load = useCallback(() => repository.list().then(visibleDomains), [repository])
  const state = useAsync(load)

  return (
    <ResumeSection
      title={text.expertiseTitle}
      state={state}
      getKey={(domain) => domain.id}
      renderTile={(domain) => <DomainTile domain={domain} />}
    />
  )
}
