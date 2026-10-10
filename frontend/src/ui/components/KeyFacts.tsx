import type { ReactNode } from 'react'
import type { Localized } from '@/domain/i18n/Locale'
import { currentExperience } from '@/domain/professionalExperience/currentExperience'
import { experienceMonths } from '@/domain/professionalExperience/experienceMonths'
import { mainStack } from '@/domain/professionalExperience/mainStack'
import type { ProfessionalExperience } from '@/domain/professionalExperience/ProfessionalExperience'
import { TagChips } from '@/ui/components/TagList'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import './KeyFacts.css'

const MAIN_STACK_SIZE = 5

interface KeyFactsProps {
  experiences: ProfessionalExperience[]
  /** Empty in every language when unset. */
  desiredRole: Localized<string>
  /** Defaults to now. */
  today?: Date
}

interface Fact {
  label: string
  value: ReactNode
  /** Text values are emphasised; chips keep their own style. */
  isText: boolean
}

/** What stands out about the owner: years of experience, current job or desired role, main stack. Only the facts that apply. */
export function KeyFacts({ experiences, desiredRole, today = new Date() }: KeyFactsProps) {
  const { locale } = useLocale()
  const text = messages[locale]
  const facts: Fact[] = []

  const years = Math.floor(experienceMonths(experiences, today) / 12)
  if (years >= 1) {
    facts.push({ label: text.factExperience, value: text.experienceYears(years), isText: true })
  }

  const current = currentExperience(experiences, today)
  if (current) {
    facts.push({
      label: text.factCurrently,
      value: text.currentRole(current.position[locale], current.company),
      isText: true,
    })
  } else if (desiredRole[locale]) {
    facts.push({ label: text.factLookingFor, value: desiredRole[locale], isText: true })
  }

  const stack = mainStack(experiences, MAIN_STACK_SIZE)
  if (stack.length > 0) {
    facts.push({
      label: text.factMainStack,
      value: <TagChips aria-label={text.factMainStack} tags={stack} />,
      isText: false,
    })
  }

  if (facts.length === 0) return null

  return (
    <dl aria-label={text.homeFactsLabel} className="key-facts">
      {facts.map((fact) => (
        <div key={fact.label} className="key-facts__fact">
          <dt>{fact.label}</dt>
          <dd className={fact.isText ? 'key-facts__text' : undefined}>{fact.value}</dd>
        </div>
      ))}
    </dl>
  )
}
