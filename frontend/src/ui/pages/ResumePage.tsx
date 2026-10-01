import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { EducationSection } from '@/ui/resume/EducationSection'
import type { Repositories } from '@/ui/Repositories'
import './ResumePage.css'

interface ResumePageProps {
  repositories: Repositories
}

export function ResumePage({ repositories }: ResumePageProps) {
  const text = messages[useLocale().locale]

  return (
    <div className="resume">
      <h1>{text.resumeTitle}</h1>
      <EducationSection repository={repositories.education} />
    </div>
  )
}
