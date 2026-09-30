import type { Key, ReactNode } from 'react'
import './TileList.css'

interface TileListProps<T> {
  items: readonly T[]
  getKey: (item: T) => Key
  renderTile: (item: T) => ReactNode
}

/** Lays out one tile per item, in the items' order. */
export function TileList<T>({ items, getKey, renderTile }: TileListProps<T>) {
  return (
    <ul className="tile-list">
      {items.map((item) => (
        <li key={getKey(item)}>{renderTile(item)}</li>
      ))}
    </ul>
  )
}
