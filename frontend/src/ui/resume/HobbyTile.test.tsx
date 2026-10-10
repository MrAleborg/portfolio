import { render, screen, within } from '@testing-library/react'
import type { Hobby } from '@/domain/hobby/Hobby'
import type { Locale } from '@/domain/i18n/Locale'
import { chess, climbing } from '@/test/fakeHobbyRepository'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import { HobbyTile } from '@/ui/resume/HobbyTile'
import { ResumeSection } from '@/ui/resume/ResumeSection'
import type { SectionVariant } from '@/ui/resume/SectionContext'

function renderTile(hobbies: readonly Hobby[] = [climbing, chess], locale: Locale = 'en') {
  return render(
    <LocaleProvider initialLocale={locale}>
      <HobbyTile hobbies={hobbies} />
    </LocaleProvider>,
  )
}

function renderInSection(variant: SectionVariant, hobbies: readonly Hobby[] = [climbing, chess]) {
  return render(
    <LocaleProvider initialLocale="en">
      <ResumeSection
        title="Hobbies"
        icon={<svg />}
        state={{ status: 'loaded', value: [hobbies] }}
        getKey={() => 'hobbies'}
        renderTile={(items) => <HobbyTile hobbies={items} />}
        variant={variant}
      />
    </LocaleProvider>,
  )
}

describe('HobbyTile', () => {
  describe('in English', () => {
    it('is a single tile named after the section', () => {
      renderTile()

      expect(screen.getAllByRole('article')).toHaveLength(1)
      expect(screen.getByRole('article')).toHaveAccessibleName('Hobbies')
    })

    it('names each hobby with a heading, in order', () => {
      renderTile()

      const names = screen
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent)
      expect(names).toEqual(['Climbing', 'Chess'])
    })

    it('shows the descriptions without any click', () => {
      renderTile()

      expect(screen.queryByRole('button')).toBeNull()
      expect(screen.getByText('Bouldering twice a week.')).toBeVisible()
    })
  })

  describe('in French', () => {
    it('is a single tile named after the section', () => {
      renderTile([climbing, chess], 'fr')

      expect(screen.getByRole('article')).toHaveAccessibleName('Loisirs')
    })

    it('names each hobby with a heading, in order', () => {
      renderTile([climbing, chess], 'fr')

      const names = screen
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent)
      expect(names).toEqual(['Escalade', 'Échecs'])
    })

    it('shows the descriptions without any click', () => {
      renderTile([climbing, chess], 'fr')

      expect(screen.getByText('De la bloc deux fois par semaine.')).toBeVisible()
    })
  })

  it('shows each paragraph of a description apart', () => {
    renderTile([
      {
        ...climbing,
        description: { en: 'First paragraph.\n\nSecond paragraph.', fr: '' },
      },
    ])

    expect(screen.getByText('First paragraph.')).toBeVisible()
    expect(screen.getByText('Second paragraph.')).toBeVisible()
  })

  it('shows only the name of a hobby without a description', () => {
    renderTile([chess])

    expect(screen.getByRole('article')).toHaveTextContent(/^Chess$/)
    expect(screen.queryByText('', { selector: 'p' })).toBeNull()
  })

  describe('in a row section', () => {
    it('drops the card around the hobbies', () => {
      renderInSection('row')

      const article = screen.getByRole('article', { name: 'Hobbies' })
      expect(article).not.toHaveClass('tile')
    })

    it('shows every hobby with its title and text', () => {
      renderInSection('row')

      const article = within(screen.getByRole('article', { name: 'Hobbies' }))
      const names = article
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent)
      expect(names).toEqual(['Climbing', 'Chess'])
      expect(article.getByText('Bouldering twice a week.')).toBeVisible()
    })
  })

  describe('in a card section', () => {
    it('keeps the card around the hobbies', () => {
      renderInSection('card')

      expect(screen.getByRole('article', { name: 'Hobbies' })).toHaveClass('tile')
    })
  })

  it('is a card on its own', () => {
    renderTile()

    expect(screen.getByRole('article')).toHaveClass('tile')
  })
})
