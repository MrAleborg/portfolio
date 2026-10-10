import type { ComponentType } from 'react'
import type { messages } from '@/ui/i18n/messages'
import {
  AwardIcon,
  BriefcaseIcon,
  CodeIcon,
  CompassIcon,
  GraduationCapIcon,
  HeartIcon,
  LayersIcon,
  MicIcon,
} from '@/ui/resume/sectionIcons'

export type ResumeSectionId =
  | 'expertise'
  | 'experience'
  | 'projects'
  | 'education'
  | 'certifications'
  | 'communications'
  | 'commitments'
  | 'hobbies'

export interface ResumeSectionEntry {
  /** Fixed English slug, used as the anchor id whatever the locale. */
  id: ResumeSectionId
  /** The `messages` key of the section title. */
  titleKey: Extract<keyof (typeof messages)['en'], `${string}Title`>
  icon: ComponentType
}

/** The sections of the resume page, in page order. */
export const resumeSections: readonly ResumeSectionEntry[] = [
  { id: 'expertise', titleKey: 'expertiseTitle', icon: LayersIcon },
  { id: 'experience', titleKey: 'professionalExperienceTitle', icon: BriefcaseIcon },
  { id: 'projects', titleKey: 'sideProjectsTitle', icon: CodeIcon },
  { id: 'education', titleKey: 'educationTitle', icon: GraduationCapIcon },
  { id: 'certifications', titleKey: 'certificationsTitle', icon: AwardIcon },
  { id: 'communications', titleKey: 'scientificCommunicationsTitle', icon: MicIcon },
  { id: 'commitments', titleKey: 'commitmentsTitle', icon: HeartIcon },
  { id: 'hobbies', titleKey: 'hobbiesTitle', icon: CompassIcon },
]
