import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { CommitmentSection } from '@/ui/resume/CommitmentSection'
import { EducationSection } from '@/ui/resume/EducationSection'
import { HobbySection } from '@/ui/resume/HobbySection'
import { ScientificCommunicationSection } from '@/ui/resume/ScientificCommunicationSection'
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
      <ScientificCommunicationSection repository={repositories.scientificCommunication} />
      <CommitmentSection repository={repositories.commitment} />
      <HobbySection repository={repositories.hobby} />
    </div>
  )
}
