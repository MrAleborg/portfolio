import type { ProfessionalExperience } from '@/domain/professionalExperience/ProfessionalExperience'
import { experienceTags } from '@/domain/professionalExperience/experienceTags'
import { ExternalLink } from '@/ui/components/ExternalLink'
import { LabelledList } from '@/ui/components/LabelledList'
import { TagChips } from '@/ui/components/TagList'
import { Tile } from '@/ui/components/Tile'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { ProjectTile } from '@/ui/resume/ProjectTile'
import { paragraphs } from '@/ui/text/paragraphs'
import './ExperienceTile.css'

interface ExperienceTileProps {
  experience: ProfessionalExperience
  /** The id of an element that describes the experience, e.g. its period. */
  describedBy?: string
  /** Whether the details start open. */
  defaultExpanded?: boolean
}

export function ExperienceTile({ experience, describedBy, defaultExpanded }: ExperienceTileProps) {
  const { locale } = useLocale()
  const text = messages[locale]
  const description = paragraphs(experience.description[locale])
  const [summary] = description
  const tags = experienceTags(experience, 5)
  const preview =
    summary || tags.length > 0 ? (
      <>
        {summary && <p className="experience-tile__summary">{summary}</p>}
        {tags.length > 0 && <TagChips aria-label={text.keyTagsLabel} tags={tags} />}
      </>
    ) : undefined

  return (
    <Tile
      title={experience.position[locale]}
      describedBy={describedBy}
      subtitle={experience.company}
      meta={[
        experience.location[locale],
        text.employmentTypes[experience.employmentType],
      ]}
      preview={preview}
      defaultExpanded={defaultExpanded}
    >
      {description.map((paragraph, index) => (
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
