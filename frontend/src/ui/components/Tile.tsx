import { Children, Fragment, useId, type ReactNode } from 'react'
import { useSectionEntry, useSectionVariant } from '@/ui/resume/SectionContext'
import './Tile.css'

interface TileProps {
  title: string
  /** The level of the title heading; 4 for a tile nested in another. */
  headingLevel?: 3 | 4
  subtitle?: string
  /** Short facts shown side by side, e.g. a period and a place; empty ones are left out. */
  meta?: ReactNode[]
  /** Shown under the header while the tile is closed, when it has details. */
  preview?: ReactNode
  /** Whether the details start open. */
  defaultExpanded?: boolean
  /** Details hidden until the title is clicked. */
  children?: ReactNode
}

/**
 * A card for one entry of a list, named by its title. A top-level tile with details
 * registers with its section, so the section can expand or collapse it with the others.
 */
export function Tile({
  title,
  headingLevel = 3,
  subtitle,
  meta = [],
  preview,
  defaultExpanded = false,
  children,
}: TileProps) {
  const titleId = useId()
  const bodyId = useId()
  const hasDetails = Children.toArray(children).some(Boolean)
  const [expanded, setExpanded] = useSectionEntry(defaultExpanded, {
    register: headingLevel === 3 && hasDetails,
  })
  const isRow = useSectionVariant() === 'row' && headingLevel === 3
  const metaItems = meta.filter(Boolean)
  const Heading = `h${headingLevel}` as const
  const className = [
    'tile',
    headingLevel === 4 && 'tile--nested',
    isRow && 'tile--row',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article className={className} aria-labelledby={titleId}>
      <Heading id={titleId} className="tile__title">
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
      </Heading>
      {subtitle && <p className="tile__subtitle">{subtitle}</p>}
      {metaItems.length > 0 && (
        <p className="tile__meta">
          {metaItems.map((item, index) => (
            <Fragment key={index}>
              {index > 0 && ' '}
              <span>{item}</span>
            </Fragment>
          ))}
        </p>
      )}
      {hasDetails && !expanded && preview && (
        <div className="tile__preview">{preview}</div>
      )}
      {hasDetails && (
        <div id={bodyId} className="tile__body" hidden={!expanded}>
          {children}
        </div>
      )}
    </article>
  )
}
