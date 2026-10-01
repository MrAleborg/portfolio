import type { Hobby } from '@/domain/hobby/Hobby'
import { Tile } from '@/ui/components/Tile'
import { useLocale } from '@/ui/i18n/useLocale'
import { paragraphs } from '@/ui/text/paragraphs'

interface HobbyTileProps {
  hobby: Hobby
}

export function HobbyTile({ hobby }: HobbyTileProps) {
  const { locale } = useLocale()

  return (
    <Tile title={hobby.name[locale]}>
      {paragraphs(hobby.description[locale]).map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </Tile>
  )
}
