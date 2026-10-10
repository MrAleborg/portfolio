import { render, screen, within } from '@testing-library/react'
import { doctorate, fakeEducationRepository, masters } from '@/test/fakeEducationRepository'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import { EducationSection } from '@/ui/resume/EducationSection'

function renderSection() {
  return render(
    <LocaleProvider initialLocale="en">
      <EducationSection repository={fakeEducationRepository([masters, doctorate])} />
    </LocaleProvider>,
  )
}

/** The entries of the loaded timeline. */
async function entries() {
  const list = await screen.findByRole('list')
  return { list, items: within(list).getAllByRole('listitem') }
}

describe('EducationSection', () => {
  it('shows the educations as an ordered list, in order', async () => {
    renderSection()

    const { list, items } = await entries()
    expect(list.tagName).toBe('OL')
    expect(items).toHaveLength(2)
    expect(within(items[0]!).getByRole('article')).toHaveAccessibleName(
      'Master’s degree, Computer Science',
    )
    expect(within(items[1]!).getByRole('article')).toHaveAccessibleName('PhD')
  })

  it('shows the period and the duration of each education beside its tile', async () => {
    renderSection()

    const { items } = await entries()
    expect(items[0]).toHaveTextContent('Sep 2015 – Jun 2017')
    expect(within(items[0]!).getByText('1 yr 10 mos')).toHaveAttribute('datetime', 'P1Y10M')
    expect(items[1]).toHaveTextContent('Oct 2021 – Present')
  })

  it('describes each education by its period and duration', async () => {
    renderSection()

    const { items } = await entries()
    expect(within(items[0]!).getByRole('article')).toHaveAccessibleDescription(
      'Sep 2015 – Jun 2017, 1 yr 10 mos',
    )
  })

  it('shows the period outside the tile', async () => {
    renderSection()

    const { items } = await entries()
    const tile = within(items[0]!).getByRole('article')
    expect(within(tile).queryAllByRole('time')).toHaveLength(0)
    expect(within(items[0]!).getAllByRole('time').length).toBeGreaterThan(0)
  })

  it('keeps the lighter row look for its tiles', async () => {
    renderSection()

    const { items } = await entries()
    for (const item of items) {
      expect(within(item).getByRole('article')).toHaveClass('tile--row')
    }
  })
})
