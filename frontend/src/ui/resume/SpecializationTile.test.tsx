import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Locale } from '@/domain/i18n/Locale'
import type { Specialization } from '@/domain/specialization/Specialization'
import { agileDelivery, cloudEngineering } from '@/test/fakeSpecializationRepository'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import { SpecializationTile } from '@/ui/resume/SpecializationTile'

function renderTile(specialization: Specialization, locale: Locale = 'en') {
  return render(
    <LocaleProvider initialLocale={locale}>
      <SpecializationTile specialization={specialization} />
    </LocaleProvider>,
  )
}

/** Clicks the tile's title to show its details. */
async function expand(name: string) {
  await userEvent.setup().click(screen.getByRole('button', { name }))
}

describe('SpecializationTile', () => {
  describe('in English', () => {
    it('is a tile named by the specialization, issued by an organization', () => {
      renderTile(cloudEngineering)

      expect(screen.getByRole('article')).toHaveAccessibleName('Cloud engineering')
      expect(screen.getByText('Coursera')).toBeInTheDocument()
    })

    it('lists its certifications once expanded, in order', async () => {
      renderTile(cloudEngineering)

      await expand('Cloud engineering')

      const list = screen.getByRole('list', { name: 'Certifications' })
      expect(list).toBeVisible()
      expect(
        within(list)
          .getAllByRole('listitem')
          .map((item) => item.textContent),
      ).toEqual(['Cloud Practitioner', 'Solutions Architect'])
    })

    it('has no list of certifications when it has none', async () => {
      renderTile({ ...cloudEngineering, certifications: [] })

      await expand('Cloud engineering')

      expect(screen.queryByRole('list')).toBeNull()
    })

    it('has no expand button without description, link and certifications', () => {
      renderTile(agileDelivery)

      expect(screen.getByRole('article')).toHaveAccessibleName('Agile delivery')
      expect(screen.queryByRole('button')).toBeNull()
    })
  })

  describe('in French', () => {
    it('lists its certifications once expanded', async () => {
      renderTile(cloudEngineering, 'fr')

      await expand('Ingénierie cloud')

      const list = screen.getByRole('list', { name: 'Certifications' })
      expect(
        within(list)
          .getAllByRole('listitem')
          .map((item) => item.textContent),
      ).toEqual(['Praticien du cloud', 'Architecte de solutions'])
    })
  })
})
