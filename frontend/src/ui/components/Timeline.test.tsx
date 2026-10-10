import { render, screen, within } from '@testing-library/react'
import type { Period } from '@/domain/period/Period'
import { Tile } from '@/ui/components/Tile'
import { Timeline } from '@/ui/components/Timeline'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'

interface Entry {
  id: number
  name: string
  period: Period
}

const finished: Entry = {
  id: 1,
  name: 'Developer',
  period: { start: '2015-09-01', end: '2017-06-30' },
}
const ongoing: Entry = {
  id: 2,
  name: 'Tech lead',
  period: { start: '2021-10-01', end: null },
}

function renderTimeline(items: readonly Entry[]) {
  return render(
    <LocaleProvider initialLocale="en">
      <Timeline
        items={items}
        getKey={(item) => item.id}
        getPeriod={(item) => item.period}
        renderTile={(item) => <Tile title={item.name} />}
      />
    </LocaleProvider>,
  )
}

afterEach(() => {
  vi.useRealTimers()
})

describe('Timeline', () => {
  it('shows an ordered list with one item per entry, in order', () => {
    renderTimeline([finished, ongoing])

    const list = screen.getByRole('list')
    const listItems = within(list).getAllByRole('listitem')
    expect(list.tagName).toBe('OL')
    expect(listItems).toHaveLength(2)
    expect(within(listItems[0]!).getByRole('heading')).toHaveTextContent('Developer')
    expect(within(listItems[1]!).getByRole('heading')).toHaveTextContent('Tech lead')
  })

  it('shows the period of each entry', () => {
    renderTimeline([finished])

    const item = screen.getByRole('listitem')
    const [start, end] = within(item).getAllByRole('time')
    expect(start).toHaveAttribute('datetime', '2015-09')
    expect(end).toHaveAttribute('datetime', '2017-06')
    expect(item).toHaveTextContent('Sep 2015 – Jun 2017')
  })

  it('shows how long each entry lasted', () => {
    renderTimeline([finished])

    const duration = within(screen.getByRole('listitem')).getByText('1 yr 10 mos')
    expect(duration).toHaveAttribute('datetime', 'P1Y10M')
  })

  it('shows an ongoing entry as lasting until today', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-10T12:00:00Z'))

    renderTimeline([ongoing])

    const item = screen.getByRole('listitem')
    expect(item).toHaveTextContent('Oct 2021 – Present')
    expect(within(item).getByText('5 yrs 1 mo')).toHaveAttribute('datetime', 'P5Y1M')
  })

  it('hides the dot from assistive technology', () => {
    const { container } = renderTimeline([finished])

    expect(container.querySelector('.timeline__dot')).toHaveAttribute('aria-hidden', 'true')
  })

  it('marks the dot of an ongoing entry only', () => {
    const { container } = renderTimeline([finished, ongoing])

    const [finishedDot, ongoingDot] = Array.from(container.querySelectorAll('.timeline__dot'))
    expect(finishedDot).not.toHaveAttribute('data-ongoing')
    expect(ongoingDot).toHaveAttribute('data-ongoing')
  })

  it('shows the tile of each entry inside its item', () => {
    renderTimeline([finished, ongoing])

    const [first, second] = screen.getAllByRole('listitem')
    expect(within(first!).getByRole('article')).toHaveAccessibleName('Developer')
    expect(within(second!).getByRole('article')).toHaveAccessibleName('Tech lead')
  })
})
