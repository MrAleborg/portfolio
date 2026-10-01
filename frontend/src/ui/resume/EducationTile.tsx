import type { Education } from '@/domain/education/Education'
import { Tile } from '@/ui/components/Tile'
import { formatPeriod } from '@/ui/i18n/formatPeriod'
import { useLocale } from '@/ui/i18n/useLocale'
import { paragraphs } from '@/ui/text/paragraphs'

interface EducationTileProps {
  education: Education
}

export function EducationTile({ education }: EducationTileProps) {
  const { locale } = useLocale()
  const lines = [
    education.fieldOfStudy[locale],
    education.grade[locale],
    ...paragraphs(education.description[locale]),
  ].filter(Boolean)

  return (
    <Tile
      title={education.degree[locale]}
      subtitle={education.institution}
      meta={[formatPeriod(education.period, locale), education.location[locale]]}
    >
      {lines.map((line, index) => (
        <p key={index}>{line}</p>
      ))}
    </Tile>
  )
}
