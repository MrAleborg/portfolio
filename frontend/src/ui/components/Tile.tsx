import { useId, type ReactNode } from 'react'
import './Tile.css'

interface TileProps {
  title: string
  subtitle?: string
  /** Short facts shown on one line, e.g. a period and a place; empty ones are left out. */
  meta?: string[]
  /** Level of the title in the page outline. */
  headingLevel?: 2 | 3 | 4
  children?: ReactNode
}

/** A card for one entry of a list, named by its title. */
export function Tile({
  title,
  subtitle,
  meta = [],
  headingLevel = 3,
  children,
}: TileProps) {
  const titleId = useId()
  const Heading = `h${headingLevel}` as const
  const metaLine = meta.filter(Boolean).join(' · ')

  return (
    <article className="tile" aria-labelledby={titleId}>
      <Heading id={titleId} className="tile__title">
        {title}
      </Heading>
      {subtitle && <p className="tile__subtitle">{subtitle}</p>}
      {metaLine && <p className="tile__meta">{metaLine}</p>}
      {children && <div className="tile__body">{children}</div>}
    </article>
  )
}
