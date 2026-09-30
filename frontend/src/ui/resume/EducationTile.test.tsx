import { render, screen } from '@testing-library/react'
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

describe('EducationTile', () => {
  describe('in English', () => {
    it('is a tile named by the degree', () => {
      renderTile(masters)

      expect(
        screen.getByRole('heading', { level: 3, name: 'Master’s degree' }),
      ).toBeInTheDocument()
      expect(screen.getByRole('article')).toHaveAccessibleName('Master’s degree')
    })

    it('shows the institution', () => {
      renderTile(masters)

      expect(screen.getByText('Université de Rennes')).toBeInTheDocument()
    })

    it('shows the period and the location', () => {
      renderTile(masters)

      expect(screen.getByText('Sep 2015 – Jun 2017 · Brittany')).toBeInTheDocument()
    })

    it('shows the field of study, the grade and the description', () => {
      renderTile(masters)

      expect(screen.getByText('Computer Science')).toBeInTheDocument()
      expect(screen.getByText('With honours')).toBeInTheDocument()
      expect(screen.getByText('Thesis on compilers.')).toBeInTheDocument()
    })

    it('shows an ongoing degree as lasting until now', () => {
      renderTile(doctorate)

      expect(screen.getByText('Oct 2021 – Present')).toBeInTheDocument()
    })
  })

  describe('in French', () => {
    it('is a tile named by the degree', () => {
      renderTile(masters, 'fr')

      expect(screen.getByRole('article')).toHaveAccessibleName('Master')
    })

    it('shows the period and the location', () => {
      renderTile(masters, 'fr')

      expect(screen.getByText('sept. 2015 – juin 2017 · Bretagne')).toBeInTheDocument()
    })

    it('shows the field of study, the grade and the description', () => {
      renderTile(masters, 'fr')

      expect(screen.getByText('Informatique')).toBeInTheDocument()
      expect(screen.getByText('Mention bien')).toBeInTheDocument()
      expect(screen.getByText('Mémoire sur les compilateurs.')).toBeInTheDocument()
    })

    it('shows an ongoing degree as lasting until now', () => {
      renderTile(doctorate, 'fr')

      expect(screen.getByText('oct. 2021 – aujourd’hui')).toBeInTheDocument()
    })
  })

  it('leaves out the optional fields that are empty', () => {
    renderTile(doctorate)

    expect(screen.getByRole('article')).toHaveTextContent(
      /^PhDInriaOct 2021 – Present$/,
    )
  })

  it('shows each paragraph of the description apart', () => {
    renderTile({
      ...masters,
      description: { en: 'First paragraph.\n\nSecond paragraph.', fr: '' },
    })

    expect(screen.getByText('First paragraph.')).toBeInTheDocument()
    expect(screen.getByText('Second paragraph.')).toBeInTheDocument()
  })
})
