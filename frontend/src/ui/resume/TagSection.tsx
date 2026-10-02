import { useCallback, useId, useState } from 'react'
import type { Domain } from '@/domain/tag/TagCategory'
import { visibleDomains } from '@/domain/tag/TagCategory'
import type { TagRepository } from '@/domain/tag/TagRepository'
import { useAsync } from '@/ui/async/useAsync'
import { TagGroup } from '@/ui/components/TagList'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { ResumeSection } from '@/ui/resume/ResumeSection'
import { LayersIcon } from '@/ui/resume/sectionIcons'
import '@/ui/components/Tile.css'
import './TagSection.css'

interface TagSectionProps {
  repository: TagRepository
}

/** A domain whose title opens and closes its categories, like a tile's title. */
function DomainBlock({ domain }: { domain: Domain }) {
  const { locale } = useLocale()
  const bodyId = useId()
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="tag-summary__domain">
      <h3 className="tag-summary__title">
        <button
          type="button"
          className="tile__toggle"
          aria-expanded={expanded}
          aria-controls={bodyId}
          onClick={() => setExpanded(!expanded)}
        >
          {domain.name[locale]}
          <span className="tile__chevron" aria-hidden="true" />
        </button>
      </h3>
      <div id={bodyId} hidden={!expanded}>
        <div className="tag-list">
          {domain.categories.map((category) => (
            <TagGroup key={category.id} label={category.name[locale]} tags={category.tags} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function TagSection({ repository }: TagSectionProps) {
  const { locale } = useLocale()
  const text = messages[locale]
  const load = useCallback(() => repository.list().then(visibleDomains), [repository])
  const state = useAsync(load)

  return (
    <ResumeSection
      title={text.expertiseTitle}
      icon={<LayersIcon />}
      state={state}
      renderItems={(domains) => (
        <div className="tag-summary">
          {domains.map((domain) => (
            <DomainBlock key={domain.id} domain={domain} />
          ))}
        </div>
      )}
    />
  )
}
