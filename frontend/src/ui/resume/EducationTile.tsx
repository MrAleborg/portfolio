import type { Education } from '@/domain/education/Education'
import { Tile } from '@/ui/components/Tile'
import { useLocale } from '@/ui/i18n/useLocale'
import { paragraphs } from '@/ui/text/paragraphs'

interface EducationTileProps {
  education: Education
  /** The id of an element that describes the education, e.g. its period. */
  describedBy?: string
}

export function EducationTile({ education, describedBy }: EducationTileProps) {
  const { locale } = useLocale()
  const lines = [
    education.grade[locale],
    ...paragraphs(education.description[locale]),
  ].filter(Boolean)

  return (
    <Tile
      describedBy={describedBy}
      title={[education.degree[locale], education.fieldOfStudy[locale]]
        .filter(Boolean)
        .join(', ')}
      subtitle={education.institution}
      meta={[education.location[locale]]}
    >
      {lines.map((line, index) => (
        <p key={index}>{line}</p>
      ))}
    </Tile>
  )
}
