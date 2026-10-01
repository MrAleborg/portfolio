import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Education } from '@/domain/education/Education'
import type { Locale } from '@/domain/i18n/Locale'
import { doctorate, masters } from '@/test/fakeEducationRepository'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import { EducationTile } from '@/ui/resume/EducationTile'

function renderTile(education: Education, locale: Locale = 'en') {
  return render(
    <LocaleProvider initialLocale={locale}>
      <EducationTile education={education} />
    </LocaleProvider>,
  )
}

/** Clicks the tile's title to show its details. */
async function expand(degree: string) {
  await userEvent.setup().click(screen.getByRole('button', { name: degree }))
}

describe('EducationTile', () => {
  describe('in English', () => {
    it('is a tile named by the degree and the field of study', () => {
      renderTile(masters)

      expect(
        screen.getByRole('heading', {
          level: 3,
          name: 'Master’s degree, Computer Science',
        }),
      ).toBeInTheDocument()
      expect(screen.getByRole('article')).toHaveAccessibleName(
        'Master’s degree, Computer Science',
      )
    })

    it('is named by the degree alone when it has no field of study', () => {
      renderTile(doctorate)

      expect(screen.getByRole('heading', { level: 3, name: 'PhD' })).toBeInTheDocument()
    })

    it('shows the institution', () => {
      renderTile(masters)

      expect(screen.getByText('Université de Rennes')).toBeInTheDocument()
    })

    it('shows the period in time elements and the location', () => {
      renderTile(masters)

      const [start, end] = screen.getAllByRole('time')
      expect(start).toHaveTextContent('Sep 2015')
      expect(end).toHaveTextContent('Jun 2017')
      expect(screen.getByText('Brittany')).toBeInTheDocument()
    })

    it('shows the grade and the description once expanded', async () => {
      renderTile(masters)

      await expand('Master’s degree, Computer Science')

      expect(screen.getByText('With honours')).toBeVisible()
      expect(screen.getByText('Thesis on compilers.')).toBeVisible()
    })

    it('does not repeat the field of study in the details', async () => {
      renderTile(masters)

      await userEvent.setup().click(screen.getByRole('button'))

      expect(screen.queryByText('Computer Science')).not.toBeInTheDocument()
    })

    it('shows an ongoing degree as lasting until now', () => {
      renderTile(doctorate)

      expect(screen.getByRole('article')).toHaveTextContent('Oct 2021 – Present')
    })
  })

  describe('in French', () => {
    it('is a tile named by the degree and the field of study', () => {
      renderTile(masters, 'fr')

      expect(screen.getByRole('article')).toHaveAccessibleName('Master, Informatique')
    })

    it('shows the period in time elements and the location', () => {
      renderTile(masters, 'fr')

      const [start, end] = screen.getAllByRole('time')
      expect(start).toHaveTextContent('sept. 2015')
      expect(end).toHaveTextContent('juin 2017')
      expect(screen.getByText('Bretagne')).toBeInTheDocument()
    })

    it('shows the grade and the description once expanded', async () => {
      renderTile(masters, 'fr')

      await expand('Master, Informatique')

      expect(screen.getByText('Mention bien')).toBeVisible()
      expect(screen.getByText('Mémoire sur les compilateurs.')).toBeVisible()
    })

    it('shows an ongoing degree as lasting until now', () => {
      renderTile(doctorate, 'fr')

      expect(screen.getByRole('article')).toHaveTextContent('oct. 2021 – aujourd’hui')
    })
  })

  it('leaves out the optional fields that are empty', () => {
    renderTile(doctorate)

    expect(screen.getByRole('article')).toHaveTextContent(
      /^PhDInriaOct 2021 – Present$/,
    )
  })

  it('shows each paragraph of the description apart', async () => {
    renderTile({
      ...masters,
      description: { en: 'First paragraph.\n\nSecond paragraph.', fr: '' },
    })

    await expand('Master’s degree, Computer Science')

    expect(screen.getByText('First paragraph.')).toBeVisible()
    expect(screen.getByText('Second paragraph.')).toBeVisible()
  })
})
