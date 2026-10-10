import type { Key, ReactNode } from 'react'
import type { Period } from '@/domain/period/Period'
import { periodDuration } from '@/domain/period/periodDuration'
import { DurationTime } from '@/ui/components/DurationTime'
import { PeriodTime } from '@/ui/components/PeriodTime'
import './Timeline.css'

interface TimelineProps<T> {
  items: readonly T[]
  getKey: (item: T) => Key
  getPeriod: (item: T) => Period
  renderTile: (item: T) => ReactNode
}

/** Lays out one tile per item along a vertical rule, with its dates beside it. */
export function Timeline<T>({ items, getKey, getPeriod, renderTile }: TimelineProps<T>) {
  const today = new Date()

  return (
    <ol className="timeline">
      {items.map((item) => {
        const period = getPeriod(item)

        return (
          <li key={getKey(item)} className="timeline__item">
            <p className="timeline__when">
              <span className="timeline__period">
                <PeriodTime period={period} />
              </span>
              <span className="timeline__separator" aria-hidden="true">
                {' · '}
              </span>
              <span className="timeline__duration">
                <DurationTime duration={periodDuration(period, today)} />
              </span>
            </p>
            <span
              className="timeline__dot"
              aria-hidden="true"
              data-ongoing={period.end === null ? '' : undefined}
            />
            <div className="timeline__tile">{renderTile(item)}</div>
          </li>
        )
      })}
    </ol>
  )
}
