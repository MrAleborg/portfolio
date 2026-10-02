import { useId, type Key, type ReactNode } from 'react'
import type { AsyncState } from '@/ui/async/useAsync'
import { TileList } from '@/ui/components/TileList'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import './ResumeSection.css'

/** How the loaded items are shown: one tile each, or in a way of the section's own. */
type Rendering<T> =
  | {
      getKey: (item: T) => Key
      renderTile: (item: T) => ReactNode
      /** Stacks the tiles instead of laying them side by side. */
      singleColumn?: boolean
      renderItems?: never
    }
  | {
      renderItems: (items: readonly T[]) => ReactNode
      getKey?: never
      renderTile?: never
      singleColumn?: never
    }

type ResumeSectionProps<T> = {
  title: string
  /** A decorative icon shown before the title; hidden from assistive technology. */
  icon: ReactNode
  state: AsyncState<readonly T[]>
} & Rendering<T>

/** A titled part of the resume that shows its entries as tiles, or its own way, once loaded. */
export function ResumeSection<T>(props: ResumeSectionProps<T>) {
  const { title, icon, state } = props
  const text = messages[useLocale().locale]
  const titleId = useId()

  return (
    <section className="resume-section" aria-labelledby={titleId}>
      <h2 id={titleId}>
        <span className="resume-section-icon" aria-hidden="true">
          {icon}
        </span>
        <span>{title}</span>
      </h2>
      {state.status === 'loading' && <p role="status">{text.loading}</p>}
      {state.status === 'error' && <p role="alert">{text.sectionUnavailable}</p>}
      {state.status === 'loaded' &&
        (state.value.length === 0 ? (
          <p>{text.sectionEmpty}</p>
        ) : props.renderItems ? (
          props.renderItems(state.value)
        ) : (
          <TileList
            items={state.value}
            getKey={props.getKey}
            renderTile={props.renderTile}
            singleColumn={props.singleColumn}
          />
        ))}
    </section>
  )
}
