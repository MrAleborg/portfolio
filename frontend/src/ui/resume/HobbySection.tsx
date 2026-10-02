import type { HobbyRepository } from '@/domain/hobby/HobbyRepository'
import { useAsync } from '@/ui/async/useAsync'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { HobbyTile } from '@/ui/resume/HobbyTile'
import { ResumeSection } from '@/ui/resume/ResumeSection'
import { CompassIcon } from '@/ui/resume/sectionIcons'

interface HobbySectionProps {
  repository: HobbyRepository
}

export function HobbySection({ repository }: HobbySectionProps) {
  const text = messages[useLocale().locale]
  const state = useAsync(repository.list)

  return (
    <ResumeSection
      title={text.hobbiesTitle}
      icon={<CompassIcon />}
      state={state}
      renderItems={(hobbies) => <HobbyTile hobbies={hobbies} />}
    />
  )
}
