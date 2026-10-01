import type { Domain } from '@/domain/tag/TagCategory'
import { TagGroup } from '@/ui/components/TagList'
import { Tile } from '@/ui/components/Tile'
import { useLocale } from '@/ui/i18n/useLocale'

interface DomainTileProps {
  domain: Domain
}

export function DomainTile({ domain }: DomainTileProps) {
  const { locale } = useLocale()

  return (
    <Tile title={domain.name[locale]}>
      <div className="tag-list">
        {domain.categories.map((category) => (
          <TagGroup key={category.id} label={category.name[locale]} tags={category.tags} />
        ))}
      </div>
    </Tile>
  )
}
