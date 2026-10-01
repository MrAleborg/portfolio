import type { EducationRepository } from '@/domain/education/EducationRepository'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { EducationSection } from '@/ui/resume/EducationSection'
import './ResumePage.css'

interface ResumePageProps {
  educationRepository: EducationRepository
}

export function ResumePage({ educationRepository }: ResumePageProps) {
  const text = messages[useLocale().locale]

  return (
    <div className="resume">
      <h1>{text.resumeTitle}</h1>
      <EducationSection repository={educationRepository} />
    </div>
  )
}
