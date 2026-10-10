import type { EducationRepository } from '@/domain/education/EducationRepository'
import { useAsync } from '@/ui/async/useAsync'
import { Timeline } from '@/ui/components/Timeline'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { EducationTile } from '@/ui/resume/EducationTile'
import { ResumeSection } from '@/ui/resume/ResumeSection'
import { GraduationCapIcon } from '@/ui/resume/sectionIcons'

interface EducationSectionProps {
  repository: EducationRepository
}

export function EducationSection({ repository }: EducationSectionProps) {
  const text = messages[useLocale().locale]
  const state = useAsync(repository.list)

  return (
    <ResumeSection
      title={text.educationTitle}
      icon={<GraduationCapIcon />}
      state={state}
      variant="row"
      renderItems={(educations) => (
        <Timeline
          items={educations}
          getKey={(education) => education.id}
          getPeriod={(education) => education.period}
          renderTile={(education, describedBy) => (
            <EducationTile education={education} describedBy={describedBy} />
          )}
        />
      )}
    />
  )
}
