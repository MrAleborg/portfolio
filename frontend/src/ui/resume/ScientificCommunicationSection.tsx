import type { ScientificCommunicationRepository } from '@/domain/scientificCommunication/ScientificCommunicationRepository'
import { useAsync } from '@/ui/async/useAsync'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { ScientificCommunicationTile } from '@/ui/resume/ScientificCommunicationTile'
import { ResumeSection } from '@/ui/resume/ResumeSection'
import { MicIcon } from '@/ui/resume/sectionIcons'

interface ScientificCommunicationSectionProps {
  repository: ScientificCommunicationRepository
}

export function ScientificCommunicationSection({ repository }: ScientificCommunicationSectionProps) {
  const text = messages[useLocale().locale]
  const state = useAsync(repository.list)

  return (
    <ResumeSection
      title={text.scientificCommunicationsTitle}
      icon={<MicIcon />}
      state={state}
      getKey={(communication) => communication.id}
      renderTile={(communication) => <ScientificCommunicationTile communication={communication} />}
    />
  )
}
