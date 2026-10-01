import type { Education } from '@/domain/education/Education'
import { PeriodTime } from '@/ui/components/PeriodTime'
import { Tile } from '@/ui/components/Tile'
import { useLocale } from '@/ui/i18n/useLocale'
import { paragraphs } from '@/ui/text/paragraphs'

interface EducationTileProps {
  education: Education
}

export function EducationTile({ education }: EducationTileProps) {
  const { locale } = useLocale()
  const lines = [
    education.grade[locale],
    ...paragraphs(education.description[locale]),
  ].filter(Boolean)

  return (
    <Tile
      title={[education.degree[locale], education.fieldOfStudy[locale]]
        .filter(Boolean)
        .join(', ')}
      subtitle={education.institution}
      meta={[<PeriodTime period={education.period} />, education.location[locale]]}
    >
      {lines.map((line, index) => (
        <p key={index}>{line}</p>
      ))}
    </Tile>
  )
}
