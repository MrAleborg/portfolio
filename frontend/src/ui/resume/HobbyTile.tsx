import type { Hobby } from '@/domain/hobby/Hobby'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { useSectionVariant } from '@/ui/resume/SectionContext'
import { paragraphs } from '@/ui/text/paragraphs'
import '@/ui/components/Tile.css'
import './HobbyTile.css'

interface HobbyTileProps {
  hobbies: readonly Hobby[]
}

export function HobbyTile({ hobbies }: HobbyTileProps) {
  const { locale } = useLocale()
  const isRow = useSectionVariant() === 'row'

  return (
    <article className={isRow ? 'hobby-tile hobby-tile--row' : 'tile'} aria-label={messages[locale].hobbiesTitle}>
      {hobbies.map((hobby) => (
        <div key={hobby.id} className="hobby-tile__hobby">
          <h3 className="tile__title">{hobby.name[locale]}</h3>
          {paragraphs(hobby.description[locale]).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      ))}
    </article>
  )
}
