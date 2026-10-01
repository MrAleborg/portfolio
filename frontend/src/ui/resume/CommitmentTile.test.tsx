import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Commitment } from '@/domain/commitment/Commitment'
import type { Locale } from '@/domain/i18n/Locale'
import { fullCommitment, minimalCommitment } from '@/test/fakeCommitmentRepository'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import { CommitmentTile } from '@/ui/resume/CommitmentTile'

function renderTile(commitment: Commitment, locale: Locale = 'en') {
  return render(
    <LocaleProvider initialLocale={locale}>
      <CommitmentTile commitment={commitment} />
    </LocaleProvider>,
  )
}

/** Clicks the tile's title to show its details. */
async function expand(role: string) {
  await userEvent.setup().click(screen.getByRole('button', { name: role }))
}

describe('CommitmentTile', () => {
  describe('in English', () => {
    it('is a tile named by the role', () => {
      renderTile(fullCommitment)

      expect(
        screen.getByRole('heading', { level: 3, name: 'Treasurer' }),
      ).toBeInTheDocument()
      expect(screen.getByRole('article')).toHaveAccessibleName('Treasurer')
    })

    it('shows the organization', () => {
      renderTile(fullCommitment)

      expect(screen.getByText('Rennes Open Data')).toBeInTheDocument()
    })

    it('shows the period in time elements, the location and the kind', () => {
      renderTile(fullCommitment)

      const [start, end] = screen.getAllByRole('time')
      expect(start).toHaveTextContent('Jan 2019')
      expect(end).toHaveTextContent('Dec 2021')
      expect(screen.getByText('Brittany')).toBeInTheDocument()
      expect(screen.getByText('Association')).toBeInTheDocument()
    })

    it('names the kinds of events and conference organizations', () => {
      const { unmount } = renderTile({ ...fullCommitment, kind: 'conference_organization' })
      expect(screen.getByText('Conference organization')).toBeInTheDocument()
      unmount()

      renderTile({ ...fullCommitment, kind: 'other_event' })
      expect(screen.getByText('Event')).toBeInTheDocument()
    })

    it('shows the description and a website link once expanded', async () => {
      renderTile(fullCommitment)

      await expand('Treasurer')

      expect(screen.getByText('Kept the books.')).toBeVisible()
      const link = screen.getByRole('link', { name: /^Website: Rennes Open Data/ })
      expect(link).toBeVisible()
      expect(link).toHaveAttribute('href', 'https://example.com/open-data')
    })

    it('shows an ongoing commitment as lasting until now', () => {
      renderTile(minimalCommitment)

      expect(screen.getByRole('article')).toHaveTextContent('May 2023 – Present')
    })
  })

  describe('in French', () => {
    it('is a tile named by the role', () => {
      renderTile(fullCommitment, 'fr')

      expect(screen.getByRole('article')).toHaveAccessibleName('Trésorier')
    })

    it('shows the period, the location and the kind', () => {
      renderTile(fullCommitment, 'fr')

      const [start, end] = screen.getAllByRole('time')
      expect(start).toHaveTextContent('janv. 2019')
      expect(end).toHaveTextContent('déc. 2021')
      expect(screen.getByText('Bretagne')).toBeInTheDocument()
      expect(screen.getByText('Association')).toBeInTheDocument()
    })

    it('names the kinds of events and conference organizations', () => {
      const { unmount } = renderTile({ ...fullCommitment, kind: 'conference_organization' }, 'fr')
      expect(screen.getByText('Organisation de conférence')).toBeInTheDocument()
      unmount()

      renderTile({ ...fullCommitment, kind: 'other_event' }, 'fr')
      expect(screen.getByText('Événement')).toBeInTheDocument()
    })

    it('shows the description and a website link once expanded', async () => {
      renderTile(fullCommitment, 'fr')

      await expand('Trésorier')

      expect(screen.getByText('Tenue des comptes.')).toBeVisible()
      expect(screen.getByRole('link', { name: /^Site web : Rennes Open Data/ })).toBeVisible()
    })
  })

  it('leaves out the optional fields that are empty', () => {
    renderTile(minimalCommitment)

    expect(screen.getByRole('article')).toHaveTextContent(
      /^MentorHackathon OuestMay 2023 – Present Event$/,
    )
  })

  it('has no expand button without a description and without a website', () => {
    renderTile(minimalCommitment)

    expect(screen.getByRole('article')).toHaveAccessibleName('Mentor')
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('can be expanded to reach the website when it has no description', async () => {
    renderTile({ ...minimalCommitment, url: 'https://example.com/hackathon' })

    await expand('Mentor')

    expect(screen.getByRole('link', { name: /^Website: Hackathon Ouest/ })).toBeVisible()
  })

  it('shows each paragraph of the description apart', async () => {
    renderTile({
      ...minimalCommitment,
      description: { en: 'First paragraph.\n\nSecond paragraph.', fr: '' },
    })

    await expand('Mentor')

    expect(screen.getByText('First paragraph.')).toBeVisible()
    expect(screen.getByText('Second paragraph.')).toBeVisible()
  })
})
