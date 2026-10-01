import { useCallback, useId } from 'react'
import { visibleDomains } from '@/domain/tag/TagCategory'
import type { TagRepository } from '@/domain/tag/TagRepository'
import { useAsync } from '@/ui/async/useAsync'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { ResumeSection } from '@/ui/resume/ResumeSection'
import '@/ui/components/LabelledList.css'
import '@/ui/components/TagList.css'
import './TagSection.css'

interface TagSectionProps {
  repository: TagRepository
}

export function TagSection({ repository }: TagSectionProps) {
  const { locale } = useLocale()
  const text = messages[locale]
  const idPrefix = useId()
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
                {domain.categories.map((category) => {
                  const labelId = `${idPrefix}-${domain.id}-${category.id}`
                  return (
                    <div key={category.id}>
                      <p id={labelId} className="tile__label tag-list__label">
                        {category.name[locale]}
                      </p>
                      <ul aria-labelledby={labelId} className="tag-list__tags">
                        {category.tags.map((tag) => (
                          <li key={tag.id} className="tag">
                            {tag.name[locale]}
                            {tag.note[locale] && (
                              <span className="tag__note"> · {tag.note[locale]}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    />
  )
}
