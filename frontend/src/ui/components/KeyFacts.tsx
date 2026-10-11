import { type ReactNode, useId } from 'react'
import type { Localized } from '@/domain/i18n/Locale'
import { currentExperience } from '@/domain/professionalExperience/currentExperience'
import { experienceMonths } from '@/domain/professionalExperience/experienceMonths'
import { mainStack } from '@/domain/professionalExperience/mainStack'
import type { ProfessionalExperience } from '@/domain/professionalExperience/ProfessionalExperience'
import type { Tag } from '@/domain/tag/Tag'
import { TagChips } from '@/ui/components/TagList'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import './KeyFacts.css'

const MAIN_STACK_SIZE = 5

interface KeyFactsProps {
  experiences: ProfessionalExperience[]
  /** Empty in every language when unset. */
  desiredRole: Localized<string>
  /** The tags the owner chose for the main stack, in order. Empty to fall back to the ranking computed from the experiences. */
  chosenStack: Tag[]
  /** Defaults to now. */
  today?: Date
}

interface Fact {
  label: string
  /** Text values are emphasised; chips keep their own style. */
  value: ReactNode
  /** Set on the term of a fact whose value is a list that it names. */
  labelId?: string
}

/**
 * What stands out about the owner: years of experience, current job or desired role, main stack. Only the facts that apply.
 * The main stack is the first 5 chosen tags in their order (methodologies included), or, when none is chosen,
 * the 5 skills and tools most used across the experiences.
 */
export function KeyFacts({ experiences, desiredRole, chosenStack, today = new Date() }: KeyFactsProps) {
  const { locale } = useLocale()
  const headingId = useId()
  const stackLabelId = useId()
  const text = messages[locale]
  const facts: Fact[] = []

  const years = Math.floor(experienceMonths(experiences, today) / 12)
  if (years >= 1) {
    facts.push({ label: text.factExperience, value: text.experienceYears(years) })
  }

  const current = currentExperience(experiences, today)
  if (current) {
    facts.push({
      label: text.factCurrently,
      value: text.currentRole(current.position[locale], current.company),
    })
  } else if (desiredRole[locale]) {
    facts.push({ label: text.factLookingFor, value: desiredRole[locale] })
  }

  const stack =
    chosenStack.length > 0
      ? chosenStack.slice(0, MAIN_STACK_SIZE)
      : mainStack(experiences, MAIN_STACK_SIZE)
  if (stack.length > 0) {
    facts.push({
      label: text.factMainStack,
      value: <TagChips aria-labelledby={stackLabelId} tags={stack} />,
      labelId: stackLabelId,
    })
  }

  if (facts.length === 0) return null

  return (
    <section aria-labelledby={headingId} className="key-facts">
      <h2 id={headingId} className="visually-hidden">
        {text.homeFactsLabel}
      </h2>
      <dl className="key-facts__list">
        {facts.map((fact) => (
          <div key={fact.label} className="key-facts__fact">
            <dt id={fact.labelId}>{fact.label}</dt>
            <dd className={typeof fact.value === 'string' ? 'key-facts__text' : undefined}>
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
