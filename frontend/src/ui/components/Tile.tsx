import { Children, useId, useState, type ReactNode } from 'react'
import './Tile.css'

interface TileProps {
  title: string
  subtitle?: string
  /** Short facts shown on one line, e.g. a period and a place; empty ones are left out. */
  meta?: string[]
  /** Details hidden until the title is clicked. */
  children?: ReactNode
}

/** A card for one entry of a list, named by its title. */
export function Tile({
  title,
  subtitle,
  meta = [],
  children,
}: TileProps) {
  const titleId = useId()
  const bodyId = useId()
  const [expanded, setExpanded] = useState(false)
  const metaLine = meta.filter(Boolean).join(' · ')
  const hasDetails = Children.toArray(children).length > 0

  return (
    <article className="tile" aria-labelledby={titleId}>
      <h3 id={titleId} className="tile__title">
        {hasDetails ? (
          <button
            type="button"
            className="tile__toggle"
            aria-expanded={expanded}
            aria-controls={bodyId}
            onClick={() => setExpanded(!expanded)}
          >
            {title}
            <span className="tile__chevron" aria-hidden="true" />
          </button>
        ) : (
          title
        )}
      </h3>
      {subtitle && <p className="tile__subtitle">{subtitle}</p>}
      {metaLine && <p className="tile__meta">{metaLine}</p>}
      {hasDetails && (
        <div id={bodyId} className="tile__body" hidden={!expanded}>
          {children}
        </div>
      )}
    </article>
  )
}
