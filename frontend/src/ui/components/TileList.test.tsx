import { render, screen, within } from '@testing-library/react'
import { Tile } from '@/ui/components/Tile'
import { TileList } from '@/ui/components/TileList'

const items = [
  { id: 1, name: 'First' },
  { id: 2, name: 'Second' },
]

describe('TileList', () => {
  it('shows one list item per entry, in order', () => {
    render(
      <TileList
        items={items}
        getKey={(item) => item.id}
        renderTile={(item) => <Tile title={item.name} />}
      />,
    )

    const listItems = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(listItems).toHaveLength(2)
    expect(within(listItems[0]!).getByRole('article')).toHaveAccessibleName('First')
    expect(within(listItems[1]!).getByRole('article')).toHaveAccessibleName('Second')
  })

  it('lays the tiles out in one column only when asked', () => {
    const { rerender } = render(
      <TileList
        items={items}
        getKey={(item) => item.id}
        renderTile={(item) => <Tile title={item.name} />}
      />,
    )
    expect(screen.getByRole('list')).not.toHaveClass('tile-list--single')

    rerender(
      <TileList
        singleColumn
        items={items}
        getKey={(item) => item.id}
        renderTile={(item) => <Tile title={item.name} />}
      />,
    )
    expect(screen.getByRole('list')).toHaveClass('tile-list--single')
  })
})
