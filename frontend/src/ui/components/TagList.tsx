import { useId } from 'react'
import type { Localized } from '@/domain/i18n/Locale'
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

interface TagGroupProps {
  label: string
  tags: readonly { id: number; name: Localized<string>; note?: Localized<string> }[]
}

/** A labelled row of chips; a chip shows its note after the name when it has one. */
export function TagGroup({ label, tags }: TagGroupProps) {
  const { locale } = useLocale()
  const labelId = useId()

  return (
    <div>
      <p id={labelId} className="tile__label tag-list__label">
        {label}
      </p>
      <ul aria-labelledby={labelId} className="tag-list__tags">
        {tags.map((tag) => (
          <li key={tag.id} className="tag">
            {tag.name[locale]}
            {tag.note?.[locale] && (
              <span className="tag__note">
                <span aria-hidden="true"> · </span>
                {tag.note[locale]}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Tags as chips, grouped by kind; nothing when there are no tags. */
export function TagList({ tags }: TagListProps) {
  const { locale } = useLocale()
  const groups = KINDS.map((kind) => ({
    kind,
    tags: tags.filter((tag) => tag.kind === kind),
  })).filter((group) => group.tags.length > 0)

  if (groups.length === 0) return null

  return (
    <div className="tag-list">
      {groups.map((group) => (
        <TagGroup key={group.kind} label={messages[locale].tagKinds[group.kind]} tags={group.tags} />
      ))}
    </div>
  )
}
