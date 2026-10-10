import { useId, type Key, type ReactElement, type ReactNode } from 'react'
import type { AsyncState } from '@/ui/async/useAsync'
import { TileList } from '@/ui/components/TileList'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import {
  SectionContext,
  useSectionRegistry,
  type SectionVariant,
} from '@/ui/resume/SectionContext'
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
  icon: ReactElement
  state: AsyncState<readonly T[]>
  /** `row` is the lighter look of secondary sections; the entries read it from the section. */
  variant?: SectionVariant
} & Rendering<T>

/** A titled part of the resume that shows its entries as tiles, or its own way, once loaded. */
export function ResumeSection<T>(props: ResumeSectionProps<T>) {
  const { title, icon, state, variant = 'card' } = props
  const text = messages[useLocale().locale]
  const titleId = useId()
  const { context, count, allOpen, toggleAll } = useSectionRegistry(variant)

  return (
    <SectionContext.Provider value={context}>
      <section
        className={
          variant === 'row'
            ? 'resume-section resume-section--row'
            : 'resume-section'
        }
        aria-labelledby={titleId}
      >
        <div className="resume-section-header">
          <h2 id={titleId}>
            <span className="resume-section-icon" aria-hidden="true">
              {icon}
            </span>
            <span>{title}</span>
          </h2>
          {count >= 2 && (
            <button
              type="button"
              className="resume-section-toggle-all"
              aria-describedby={titleId}
              onClick={toggleAll}
            >
              {allOpen ? text.collapseAll : text.expandAll}
            </button>
          )}
        </div>
        {state.status === 'loading' && <p role="status">{text.loading}</p>}
        {state.status === 'error' && (
          <p role="alert">{text.sectionUnavailable}</p>
        )}
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
    </SectionContext.Provider>
  )
}
