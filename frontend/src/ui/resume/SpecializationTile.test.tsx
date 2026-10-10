import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Certification } from '@/domain/certification/Certification'
import type { Locale } from '@/domain/i18n/Locale'
import type { Specialization } from '@/domain/specialization/Specialization'
import { cloudPractitioner, scrumMaster } from '@/test/fakeCertificationRepository'
import { agileDelivery, cloudEngineering } from '@/test/fakeSpecializationRepository'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import { ResumeSection } from '@/ui/resume/ResumeSection'
import type { SectionVariant } from '@/ui/resume/SectionContext'
import { SpecializationTile } from '@/ui/resume/SpecializationTile'

function renderTile(
  specialization: Specialization,
  certifications: Certification[] = [],
  locale: Locale = 'en',
) {
  return render(
    <LocaleProvider initialLocale={locale}>
      <SpecializationTile specialization={specialization} certifications={certifications} />
    </LocaleProvider>,
  )
}

function renderInSection(
  variant: SectionVariant,
  specialization: Specialization,
  certifications: Certification[],
) {
  return render(
    <LocaleProvider initialLocale="en">
      <ResumeSection
        title="Specializations"
        icon={<svg />}
        state={{ status: 'loaded', value: [specialization] }}
        getKey={(item) => item.id}
        renderTile={(item) => (
          <SpecializationTile specialization={item} certifications={certifications} />
        )}
        variant={variant}
      />
    </LocaleProvider>,
  )
}

/** Clicks a tile's title to show its details. */
async function expand(name: string) {
  await userEvent.setup().click(screen.getByRole('button', { name }))
}

describe('SpecializationTile', () => {
  describe('in English', () => {
    it('is a tile named by the specialization, issued by an organization', () => {
      renderTile(cloudEngineering)

      expect(screen.getByRole('article', { name: 'Cloud engineering' })).toBeInTheDocument()
      expect(screen.getByText('Coursera')).toBeInTheDocument()
    })

    it('hides its certifications until it is expanded', async () => {
      renderTile(cloudEngineering, [cloudPractitioner])

      expect(screen.queryByRole('heading', { name: 'Cloud Practitioner' })).toBeNull()

      await expand('Cloud engineering')

      expect(screen.getByRole('heading', { name: 'Cloud Practitioner' })).toBeVisible()
    })

    it('shows its certifications as nested tiles under level 4 headings, in order', async () => {
      renderTile(cloudEngineering, [cloudPractitioner, scrumMaster])

      await expand('Cloud engineering')

      expect(screen.getAllByRole('heading', { level: 4 }).map((heading) => heading.textContent)).toEqual([
        'Cloud Practitioner',
        'Scrum Master',
      ])
    })

    it('lets each nested certification be expanded on its own', async () => {
      renderTile(cloudEngineering, [cloudPractitioner])
      await expand('Cloud engineering')
      const nested = within(screen.getByRole('article', { name: 'Cloud Practitioner' }))
      expect(nested.getByText('Covers the basics.')).not.toBeVisible()

      await userEvent.setup().click(nested.getByRole('button', { name: 'Cloud Practitioner' }))

      expect(nested.getByText('Covers the basics.')).toBeVisible()
      expect(nested.getByRole('list', { name: 'Skills' })).toBeVisible()
    })

    it('has no expand button without description, link and certifications', () => {
      renderTile(agileDelivery)

      expect(screen.getByRole('article', { name: 'Agile delivery' })).toBeInTheDocument()
      expect(screen.queryByRole('button')).toBeNull()
    })

    it('can be expanded to reach its certifications when it has nothing else', async () => {
      renderTile(agileDelivery, [cloudPractitioner])

      await expand('Agile delivery')

      expect(screen.getByRole('heading', { level: 4, name: 'Cloud Practitioner' })).toBeVisible()
    })
  })

  describe('in French', () => {
    it('shows its certifications in French once expanded', async () => {
      renderTile(cloudEngineering, [cloudPractitioner], 'fr')

      await expand('Ingénierie cloud')

      expect(screen.getByRole('heading', { level: 4, name: 'Praticien du cloud' })).toBeVisible()
    })
  })

  describe('in a row section', () => {
    it('lists its certifications inside the row tile, each still toggleable', async () => {
      renderInSection('row', cloudEngineering, [cloudPractitioner])
      await expand('Cloud engineering')

      const row = screen.getByRole('article', { name: 'Cloud engineering' })
      expect(row).toHaveClass('tile--row')
      const nested = within(within(row).getByRole('article', { name: 'Cloud Practitioner' }))
      expect(nested.getByText('Covers the basics.')).not.toBeVisible()

      await userEvent.setup().click(nested.getByRole('button', { name: 'Cloud Practitioner' }))

      expect(nested.getByText('Covers the basics.')).toBeVisible()
    })
  })
})
