import type { Key, ReactNode } from 'react'
import './TileList.css'

interface TileListProps<T> {
  items: readonly T[]
  getKey: (item: T) => Key
  /** Stacks the tiles instead of laying them side by side. */
  singleColumn?: boolean
  renderTile: (item: T) => ReactNode
}

/** Lays out one tile per item, in the items' order. */
export function TileList<T>({
  items,
  getKey,
  renderTile,
  singleColumn = false,
}: TileListProps<T>) {
  return (
    <ul className={singleColumn ? 'tile-list tile-list--single' : 'tile-list'}>
      {items.map((item) => (
        <li key={getKey(item)}>{renderTile(item)}</li>
      ))}
    </ul>
  )
}
