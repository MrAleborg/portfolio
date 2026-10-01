import type { ProfessionalExperience } from '@/domain/professionalExperience/ProfessionalExperience'
import { ExternalLink } from '@/ui/components/ExternalLink'
import { LabelledList } from '@/ui/components/LabelledList'
import { PeriodTime } from '@/ui/components/PeriodTime'
import { Tile } from '@/ui/components/Tile'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { ProjectTile } from '@/ui/resume/ProjectTile'
import { paragraphs } from '@/ui/text/paragraphs'
import './ExperienceTile.css'

interface ExperienceTileProps {
  experience: ProfessionalExperience
}

export function ExperienceTile({ experience }: ExperienceTileProps) {
  const { locale } = useLocale()
  const text = messages[locale]

  return (
    <Tile
      title={experience.position[locale]}
      subtitle={experience.company}
      meta={[
        <PeriodTime period={experience.period} />,
        experience.location[locale],
        text.employmentTypes[experience.employmentType],
      ]}
    >
      {paragraphs(experience.description[locale]).map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
      {experience.companyUrl ? (
        <p>
          <ExternalLink href={experience.companyUrl} context={experience.company}>{text.websiteLink}</ExternalLink>
        </p>
      ) : null}
      {experience.projects.length > 0 ? (
        <LabelledList
          label={text.projectsLabel}
          className="experience-projects"
          items={experience.projects.map((project) => (
            <ProjectTile project={project} headingLevel={4} />
          ))}
        />
      ) : null}
    </Tile>
  )
}
