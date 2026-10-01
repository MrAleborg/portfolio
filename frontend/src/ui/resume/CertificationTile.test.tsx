import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Certification } from '@/domain/certification/Certification'
import type { Locale } from '@/domain/i18n/Locale'
import { cloudPractitioner, scrumMaster } from '@/test/fakeCertificationRepository'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import { CertificationTile } from '@/ui/resume/CertificationTile'

function renderTile(certification: Certification, locale: Locale = 'en') {
  return render(
    <LocaleProvider initialLocale={locale}>
      <CertificationTile certification={certification} />
    </LocaleProvider>,
  )
}

/** Clicks the tile's title to show its details. */
async function expand(name: string) {
  await userEvent.setup().click(screen.getByRole('button', { name }))
}

describe('CertificationTile', () => {
  describe('in English', () => {
    it('is a tile named by the certification, issued by an organization', () => {
      renderTile(cloudPractitioner)

      expect(screen.getByRole('article')).toHaveAccessibleName('Cloud Practitioner')
      expect(screen.getByText('Amazon')).toBeInTheDocument()
    })

    it('lists the specializations it is part of once expanded', async () => {
      renderTile(cloudPractitioner)

      await expand('Cloud Practitioner')

      const list = screen.getByRole('list', { name: 'Part of' })
      expect(list).toBeVisible()
      expect(within(list).getByRole('listitem')).toHaveTextContent('Cloud engineering')
    })

    it('shows the tags grouped by kind once expanded', async () => {
      renderTile(cloudPractitioner)

      await expand('Cloud Practitioner')

      expect(
        within(screen.getByRole('list', { name: 'Skills' })).getByRole('listitem'),
      ).toHaveTextContent('Cloud')
      expect(
        within(screen.getByRole('list', { name: 'Tools' })).getByRole('listitem'),
      ).toHaveTextContent('Terraform')
    })

    it('has no list of specializations when it is part of none', async () => {
      renderTile({ ...cloudPractitioner, specializations: [] })

      await expand('Cloud Practitioner')

      expect(screen.queryByRole('list', { name: 'Part of' })).toBeNull()
    })

    it('can be expanded to reach its tags when it has nothing else', async () => {
      renderTile({ ...scrumMaster, tags: cloudPractitioner.tags })

      await expand('Scrum Master')

      expect(screen.getByRole('list', { name: 'Skills' })).toBeVisible()
    })

    it('has no expand button without description, link, specializations and tags', () => {
      renderTile(scrumMaster)

      expect(screen.getByRole('article')).toHaveAccessibleName('Scrum Master')
      expect(screen.queryByRole('button')).toBeNull()
    })
  })

  describe('in French', () => {
    it('lists the specializations it is part of once expanded', async () => {
      renderTile(cloudPractitioner, 'fr')

      await expand('Praticien du cloud')

      const list = screen.getByRole('list', { name: 'Fait partie de' })
      expect(within(list).getByRole('listitem')).toHaveTextContent('Ingénierie cloud')
    })

    it('shows the tag groups in French', async () => {
      renderTile(cloudPractitioner, 'fr')

      await expand('Praticien du cloud')

      expect(screen.getByRole('list', { name: 'Compétences' })).toBeVisible()
      expect(screen.getByRole('list', { name: 'Outils' })).toBeVisible()
    })
  })
})
