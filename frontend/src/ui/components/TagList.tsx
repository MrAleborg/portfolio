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

interface Chip {
  id: number
  name: Localized<string>
  note?: Localized<string>
  /** Colours this chip, over the kind of its list. */
  kind?: TagKind
}

type TagChipsProps = {
  /** Colours the chips by kind; chips without a kind are neutral. */
  kind?: TagKind
  tags: readonly Chip[]
} & ({ 'aria-label': string } | { 'aria-labelledby': string })

/** A list of chips; a chip shows its note after the name when it has one. */
export function TagChips({ kind, tags, ...labelling }: TagChipsProps) {
  const { locale } = useLocale()

  return (
    <ul {...labelling} className="tag-list__tags">
      {tags.map((tag) => {
        const chipKind = tag.kind ?? kind
        return (
          <li key={tag.id} className={chipKind ? `tag tag--${chipKind}` : 'tag'}>
            {tag.name[locale]}
            {tag.note?.[locale] && (
              <span className="tag__note">
                <span aria-hidden="true"> · </span>
                {tag.note[locale]}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

interface TagGroupProps {
  label: string
  /** Colours the chips by kind; chips without a kind are neutral. */
  kind?: TagKind
  tags: readonly Chip[]
}

/** A labelled row of chips. */
export function TagGroup({ label, kind, tags }: TagGroupProps) {
  const labelId = useId()

  return (
    <div>
      <p id={labelId} className="tile__label tag-list__label">
        {label}
      </p>
      <TagChips aria-labelledby={labelId} kind={kind} tags={tags} />
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
        <TagGroup
          key={group.kind}
          kind={group.kind}
          label={messages[locale].tagKinds[group.kind]}
          tags={group.tags}
        />
      ))}
    </div>
  )
}
