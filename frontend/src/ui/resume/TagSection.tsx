import { useCallback } from 'react'
import { visibleDomains } from '@/domain/tag/TagCategory'
import type { TagRepository } from '@/domain/tag/TagRepository'
import { useAsync } from '@/ui/async/useAsync'
import { TagGroup } from '@/ui/components/TagList'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { ResumeSection } from '@/ui/resume/ResumeSection'
import './TagSection.css'

interface TagSectionProps {
  repository: TagRepository
}

export function TagSection({ repository }: TagSectionProps) {
  const { locale } = useLocale()
  const text = messages[locale]
  const load = useCallback(() => repository.list().then(visibleDomains), [repository])
  const state = useAsync(load)

  return (
    <ResumeSection
      title={text.expertiseTitle}
      state={state}
      renderItems={(domains) => (
        <div className="tag-summary">
          {domains.map((domain) => (
            <div key={domain.id} className="tag-summary__domain">
              <h3 className="tag-summary__title">{domain.name[locale]}</h3>
              <div className="tag-list">
                {domain.categories.map((category) => (
                  <TagGroup key={category.id} label={category.name[locale]} tags={category.tags} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    />
  )
}
