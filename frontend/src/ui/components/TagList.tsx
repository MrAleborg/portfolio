import { useId } from 'react'
import type { Tag, TagKind } from '@/domain/tag/Tag'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import '@/ui/components/LabelledList.css'
import './TagList.css'

interface TagListProps {
  tags: readonly Tag[]
}

/** The order in which the groups are shown. */
const KINDS: TagKind[] = ['skill', 'tool', 'methodology']

/** Tags as chips, grouped by kind; nothing when there are no tags. */
export function TagList({ tags }: TagListProps) {
  const { locale } = useLocale()
  const idPrefix = useId()
  const groups = KINDS.map((kind) => ({
    kind,
    tags: tags.filter((tag) => tag.kind === kind),
  })).filter((group) => group.tags.length > 0)

  if (groups.length === 0) return null

  return (
    <div className="tag-list">
      {groups.map((group) => {
        const labelId = `${idPrefix}-${group.kind}`
        return (
          <div key={group.kind}>
            <p id={labelId} className="tile__label tag-list__label">
              {messages[locale].tagKinds[group.kind]}
            </p>
            <ul aria-labelledby={labelId} className="tag-list__tags">
              {group.tags.map((tag) => (
                <li key={tag.id} className="tag">
                  {tag.name[locale]}
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
