import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  fakeProfessionalExperienceRepository,
  fullExperience,
  minimalExperience,
} from '@/test/fakeProfessionalExperienceRepository'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import { ExperienceSection } from '@/ui/resume/ExperienceSection'

const techLead = {
  ...fullExperience,
  id: 3,
  position: { en: 'Tech lead', fr: 'Responsable technique' },
  period: { start: '2022-09-01', end: '2024-06-30' },
}

function renderSection(entries = [fullExperience, techLead, minimalExperience]) {
  return render(
    <LocaleProvider initialLocale="en">
      <ExperienceSection repository={fakeProfessionalExperienceRepository(entries)} />
    </LocaleProvider>,
  )
}

/** The items of the experiences list itself, once the section has loaded, not those nested in the cards. */
async function loadedItems() {
  const [list] = await screen.findAllByRole('list')
  return Array.from(list!.children) as HTMLElement[]
}

afterEach(() => {
  vi.useRealTimers()
})

describe('ExperienceSection', () => {
  it('shows the experiences as an ordered list, in order', async () => {
    renderSection()

    const items = await loadedItems()
    expect(screen.getAllByRole('list')[0]?.tagName).toBe('OL')
    expect(items).toHaveLength(3)
    expect(within(items[0]!).getByRole('button', { name: 'Software engineer' })).toBeVisible()
    expect(within(items[1]!).getByRole('button', { name: 'Tech lead' })).toBeVisible()
    expect(within(items[2]!).getByRole('article', { name: 'Consultant' })).toBeVisible()
  })

  it('shows the period and the duration of each experience beside it', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-10T12:00:00Z'))
    renderSection()

    const [first, second, third] = await loadedItems()
    expect(first).toHaveTextContent('Sep 2019 – Aug 2022')
    expect(within(first!).getByText('3 yrs')).toBeInTheDocument()
    expect(second).toHaveTextContent('Sep 2022 – Jun 2024')
    expect(within(second!).getByText('1 yr 10 mos')).toBeInTheDocument()
    expect(third).toHaveTextContent('Jan 2023 – Present')
    expect(within(third!).getByText('3 yrs 10 mos')).toBeInTheDocument()
  })

  it('shows the period and the duration in French', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-10T12:00:00Z'))
    render(
      <LocaleProvider initialLocale="fr">
        <ExperienceSection repository={fakeProfessionalExperienceRepository([fullExperience])} />
      </LocaleProvider>,
    )

    const [item] = await loadedItems()
    expect(item).toHaveTextContent('sept. 2019 – août 2022')
    expect(within(item!).getByText('3 ans')).toBeInTheDocument()
  })

  it('shows the period in the timeline, not in the card', async () => {
    renderSection([fullExperience])

    const [item] = await loadedItems()
    const card = within(item!).getByRole('article', { name: 'Software engineer' })
    expect(card).not.toHaveTextContent('Sep 2019')
    expect(card).not.toHaveTextContent('Aug 2022')
    expect(item).toHaveTextContent('Sep 2019 – Aug 2022')
  })

  it('opens the first experience, showing its projects, and keeps the next ones closed with their preview', async () => {
    renderSection()

    const [first, second] = await loadedItems()
    expect(within(first!).getByRole('button', { name: 'Software engineer' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(within(first!).getByRole('list', { name: 'Projects' })).toBeVisible()
    expect(within(second!).getByRole('button', { name: 'Tech lead' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(within(second!).getByRole('list', { name: 'Main keywords' })).toBeVisible()
  })

  it('keeps the projects inside the card of their experience', async () => {
    renderSection()

    const [first] = await loadedItems()
    const card = within(first!).getByRole('article', { name: 'Software engineer' })
    const projects = within(card).getByRole('list', { name: 'Projects' })
    expect(within(projects).getByRole('heading', { name: 'Portfolio site' })).toBeVisible()
  })

  it('collapses and expands every experience at once', async () => {
    const user = userEvent.setup()
    renderSection()
    await loadedItems()

    await user.click(screen.getByRole('button', { name: 'Expand all' }))
    expect(screen.getByRole('button', { name: 'Tech lead' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )

    await user.click(screen.getByRole('button', { name: 'Collapse all' }))
    expect(screen.getByRole('button', { name: 'Software engineer' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(screen.getByRole('button', { name: 'Expand all' })).toBeInTheDocument()
  })
})
