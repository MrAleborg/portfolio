import type { ReactNode } from 'react'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { CertificationSection } from '@/ui/resume/CertificationSection'
import { CommitmentSection } from '@/ui/resume/CommitmentSection'
import { EducationSection } from '@/ui/resume/EducationSection'
import { ExperienceSection } from '@/ui/resume/ExperienceSection'
import { HobbySection } from '@/ui/resume/HobbySection'
import { resumeSections, type ResumeSectionId } from '@/ui/resume/resumeSections'
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

  const sectionById: Record<ResumeSectionId, ReactNode> = {
    expertise: <TagSection repository={repositories.tag} />,
    experience: <ExperienceSection repository={repositories.experience} />,
    projects: <SideProjectSection repository={repositories.project} />,
    education: <EducationSection repository={repositories.education} />,
    certifications: (
      <CertificationSection
        certificationRepository={repositories.certification}
        specializationRepository={repositories.specialization}
      />
    ),
    communications: (
      <ScientificCommunicationSection repository={repositories.scientificCommunication} />
    ),
    commitments: <CommitmentSection repository={repositories.commitment} />,
    hobbies: <HobbySection repository={repositories.hobby} />,
  }

  return (
    <div className="resume">
      <h1 className="resume__title">{text.resumeTitle}</h1>
      <div className="resume__index" />
      <div className="resume__sections">
        {resumeSections.map(({ id }) => (
          <div key={id} id={id} className="resume__anchor">
            {sectionById[id]}
          </div>
        ))}
      </div>
    </div>
  )
}
