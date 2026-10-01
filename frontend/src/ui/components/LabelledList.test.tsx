import { render, screen, within } from '@testing-library/react'
import { LabelledList } from '@/ui/components/LabelledList'

describe('LabelledList', () => {
  it('is a list named by its label', () => {
    render(<LabelledList label="Part of" items={['Cloud', 'Data']} />)

    expect(screen.getByRole('list', { name: 'Part of' })).toBeInTheDocument()
  })

  it('shows the items in order', () => {
    render(<LabelledList label="Part of" items={['Cloud', 'Data']} />)

    const items = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(items.map((item) => item.textContent)).toEqual(['Cloud', 'Data'])
  })

  it('shows nothing without items', () => {
    const { container } = render(<LabelledList label="Part of" items={[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('accepts elements as items', () => {
    render(<LabelledList label="Part of" items={[<a href="/cloud">Cloud</a>, 'Data']} />)

    const items = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(within(items[0]!).getByRole('link', { name: 'Cloud' })).toBeInTheDocument()
    expect(items[1]).toHaveTextContent('Data')
  })

  it('gives its class to the list', () => {
    render(<LabelledList label="Part of" items={['Cloud']} className="stack" />)

    expect(screen.getByRole('list', { name: 'Part of' })).toHaveClass('stack')
  })
})
