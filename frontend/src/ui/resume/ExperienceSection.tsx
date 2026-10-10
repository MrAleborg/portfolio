import type { ProfessionalExperienceRepository } from '@/domain/professionalExperience/ProfessionalExperienceRepository'
import { useAsync } from '@/ui/async/useAsync'
import { Timeline } from '@/ui/components/Timeline'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { ExperienceTile } from '@/ui/resume/ExperienceTile'
import { ResumeSection } from '@/ui/resume/ResumeSection'
import { BriefcaseIcon } from '@/ui/resume/sectionIcons'

interface ExperienceSectionProps {
  repository: ProfessionalExperienceRepository
}

export function ExperienceSection({ repository }: ExperienceSectionProps) {
  const text = messages[useLocale().locale]
  const state = useAsync(repository.list)

  return (
    <ResumeSection
      title={text.professionalExperienceTitle}
      icon={<BriefcaseIcon />}
      state={state}
      renderItems={(experiences) => (
        <Timeline
          items={experiences}
          getKey={(experience) => experience.id}
          getPeriod={(experience) => experience.period}
          renderTile={(experience, describedBy) => (
            <ExperienceTile
              experience={experience}
              describedBy={describedBy}
              defaultExpanded={experience === experiences[0]}
            />
          )}
        />
      )}
    />
  )
}
