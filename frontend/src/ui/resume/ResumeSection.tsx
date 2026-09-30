import { useId, type Key, type ReactNode } from 'react'
import type { AsyncState } from '@/ui/async/useAsync'
import { TileList } from '@/ui/components/TileList'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import './ResumeSection.css'

interface ResumeSectionProps<T> {
  title: string
  state: AsyncState<readonly T[]>
  getKey: (item: T) => Key
  renderTile: (item: T) => ReactNode
}

/** A titled part of the resume that shows its entries as tiles once loaded. */
export function ResumeSection<T>({
  title,
  state,
  getKey,
  renderTile,
}: ResumeSectionProps<T>) {
  const text = messages[useLocale().locale]
  const titleId = useId()

  return (
    <section className="resume-section" aria-labelledby={titleId}>
      <h2 id={titleId}>{title}</h2>
      {state.status === 'loading' && <p role="status">{text.loading}</p>}
      {state.status === 'error' && <p role="alert">{text.sectionUnavailable}</p>}
      {state.status === 'loaded' &&
        (state.value.length === 0 ? (
          <p>{text.sectionEmpty}</p>
        ) : (
          <TileList items={state.value} getKey={getKey} renderTile={renderTile} />
        ))}
    </section>
  )
}
