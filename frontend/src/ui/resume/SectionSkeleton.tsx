import { TileList } from '@/ui/components/TileList'
import type { SectionVariant } from '@/ui/resume/SectionContext'
import './SectionSkeleton.css'

interface SectionSkeletonProps {
  variant: SectionVariant
  /** Stacks the card placeholders instead of laying them side by side. */
  singleColumn?: boolean
  /** How many placeholders to show; defaults to what suits the variant. */
  placeholderCount?: number
}

const PLACEHOLDERS: Record<SectionVariant, readonly number[]> = { card: [0, 1], row: [0, 1, 2] }

/**
 * Placeholders shaped like a section's entries, shown while they load so the page barely
 * moves when they arrive. Purely decorative: hidden from assistive technology.
 */
export function SectionSkeleton({
  variant,
  singleColumn = false,
  placeholderCount,
}: SectionSkeletonProps) {
  const placeholders =
    placeholderCount === undefined
      ? PLACEHOLDERS[variant]
      : Array.from({ length: placeholderCount }, (_, index) => index)

  return (
    <div aria-hidden="true">
      <TileList
        items={placeholders}
        getKey={(index) => index}
        singleColumn={singleColumn}
        renderTile={() =>
          variant === 'row' ? (
            <div className="tile tile--row">
              <span className="section-skeleton__bar section-skeleton__bar--row-title" />
              <span className="section-skeleton__bar section-skeleton__bar--row-meta" />
            </div>
          ) : (
            <div className="tile">
              <span className="section-skeleton__bar section-skeleton__bar--title" />
              <span className="section-skeleton__bar section-skeleton__bar--subtitle" />
              <span className="section-skeleton__bar section-skeleton__bar--meta" />
            </div>
          )
        }
      />
    </div>
  )
}
