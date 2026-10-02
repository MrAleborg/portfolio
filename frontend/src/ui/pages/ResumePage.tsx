import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { CertificationSection } from '@/ui/resume/CertificationSection'
import { CommitmentSection } from '@/ui/resume/CommitmentSection'
import { EducationSection } from '@/ui/resume/EducationSection'
import { ExperienceSection } from '@/ui/resume/ExperienceSection'
import { HobbySection } from '@/ui/resume/HobbySection'
import { ScientificCommunicationSection } from '@/ui/resume/ScientificCommunicationSection'
import { SideProjectSection } from '@/ui/resume/SideProjectSection'
import { TagSection } from '@/ui/resume/TagSection'
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
      <TagSection repository={repositories.tag} />
      <ExperienceSection repository={repositories.experience} />
      <SideProjectSection repository={repositories.project} />
      <EducationSection repository={repositories.education} />
      <CertificationSection
        certificationRepository={repositories.certification}
        specializationRepository={repositories.specialization}
      />
      <ScientificCommunicationSection repository={repositories.scientificCommunication} />
      <CommitmentSection repository={repositories.commitment} />
      <HobbySection repository={repositories.hobby} />
    </div>
  )
}
