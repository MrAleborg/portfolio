import type { ProjectRepository } from '@/domain/project/ProjectRepository'
import { useAsync } from '@/ui/async/useAsync'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { ProjectTile } from '@/ui/resume/ProjectTile'
import { ResumeSection } from '@/ui/resume/ResumeSection'
import { CodeIcon } from '@/ui/resume/sectionIcons'

interface SideProjectSectionProps {
  repository: ProjectRepository
}

export function SideProjectSection({ repository }: SideProjectSectionProps) {
  const text = messages[useLocale().locale]
  const state = useAsync(repository.listSideProjects)

  return (
    <ResumeSection
      title={text.sideProjectsTitle}
      icon={<CodeIcon />}
      state={state}
      getKey={(project) => project.id}
      renderTile={(project) => <ProjectTile project={project} />}
    />
  )
}
