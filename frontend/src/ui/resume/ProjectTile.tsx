import type { Project } from '@/domain/project/Project'
import { LabelledList } from '@/ui/components/LabelledList'
import { PeriodTime } from '@/ui/components/PeriodTime'
import { TagList } from '@/ui/components/TagList'
import { Tile } from '@/ui/components/Tile'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { paragraphs } from '@/ui/text/paragraphs'

interface ProjectTileProps {
  project: Project
  headingLevel?: 3 | 4
}

export function ProjectTile({ project, headingLevel }: ProjectTileProps) {
  const { locale } = useLocale()
  const text = messages[locale]

  return (
    <Tile
      title={project.title[locale]}
      headingLevel={headingLevel}
      meta={[<PeriodTime period={project.period} />]}
    >
      {paragraphs(project.description[locale]).map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
      {project.missions.length > 0 ? (
        <LabelledList
          label={text.missions}
          items={project.missions.map((mission) => mission[locale])}
        />
      ) : null}
      {project.achievements.length > 0 ? (
        <LabelledList
          label={text.achievements}
          items={project.achievements.map((achievement) => achievement[locale])}
        />
      ) : null}
      {project.tags.length > 0 ? <TagList tags={project.tags} /> : null}
    </Tile>
  )
}
