import { useId, type ReactNode } from 'react'
import './LabelledList.css'

interface LabelledListProps {
  label: string
  items: ReactNode[]
  /** Added to the list, e.g. to change how its items are laid out. */
  className?: string
}

/** A bulleted list introduced by a label; nothing when there are no items. */
export function LabelledList({ label, items, className }: LabelledListProps) {
  const labelId = useId()

  if (items.length === 0) return null

  return (
    <>
      <p id={labelId} className="tile__label">
        {label}
      </p>
      <ul aria-labelledby={labelId} className={className}>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </>
  )
}
