import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Locale } from '@/domain/i18n/Locale'
import type { Domain } from '@/domain/tag/TagCategory'
import type { TagRepository } from '@/domain/tag/TagRepository'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import { TagSection } from '@/ui/resume/TagSection'

const backend: Domain = {
  id: 1,
  name: { en: 'Backend', fr: 'Serveur' },
  categories: [
    {
      id: 10,
      name: { en: 'Languages', fr: 'Langages' },
      tags: [{ id: 100, name: { en: 'Java', fr: 'Java' }, note: { en: '', fr: '' } }],
    },
  ],
}

const frontend: Domain = {
  id: 2,
  name: { en: 'Frontend', fr: 'Interface' },
  categories: [
    {
      id: 20,
      name: { en: 'Frameworks', fr: 'Cadres' },
      tags: [{ id: 200, name: { en: 'React', fr: 'React' }, note: { en: '', fr: '' } }],
    },
  ],
}

function fakeRepository(domains: Domain[]): TagRepository {
  return { list: () => Promise.resolve(domains) }
}

async function renderSection(domains: Domain[], locale: Locale = 'en') {
  render(
    <LocaleProvider initialLocale={locale}>
      <TagSection repository={fakeRepository(domains)} />
    </LocaleProvider>,
  )
  await screen.findByRole('button', { name: domains[0]?.name[locale] })
}

function section() {
  return within(screen.getByRole('region', { name: 'Expertise' }))
}

function domain(name: string) {
  return section().getByRole('button', { name })
}

describe('TagSection', () => {
  describe('with several domains', () => {
    it('opens every domain once loaded', async () => {
      await renderSection([backend, frontend])

      expect(domain('Backend')).toHaveAttribute('aria-expanded', 'true')
      expect(domain('Frontend')).toHaveAttribute('aria-expanded', 'true')
    })

    it('shows the tags of every domain once loaded', async () => {
      await renderSection([backend, frontend])

      expect(section().getByText('Java')).toBeVisible()
      expect(section().getByText('React')).toBeVisible()
    })

    it('offers to collapse all, since every domain is open', async () => {
      await renderSection([backend, frontend])

      expect(section().getByRole('button', { name: 'Collapse all' })).toBeInTheDocument()
    })

    it('closes every domain when collapsing all', async () => {
      await renderSection([backend, frontend])

      await userEvent.click(section().getByRole('button', { name: 'Collapse all' }))

      expect(domain('Backend')).toHaveAttribute('aria-expanded', 'false')
      expect(domain('Frontend')).toHaveAttribute('aria-expanded', 'false')
      expect(section().getByText('Java')).not.toBeVisible()
      expect(section().getByText('React')).not.toBeVisible()
    })

    it('offers to expand all once every domain is closed', async () => {
      await renderSection([backend, frontend])

      await userEvent.click(section().getByRole('button', { name: 'Collapse all' }))

      expect(section().getByRole('button', { name: 'Expand all' })).toBeInTheDocument()
    })

    it('opens every domain again when expanding all', async () => {
      await renderSection([backend, frontend])
      await userEvent.click(section().getByRole('button', { name: 'Collapse all' }))

      await userEvent.click(section().getByRole('button', { name: 'Expand all' }))

      expect(domain('Backend')).toHaveAttribute('aria-expanded', 'true')
      expect(domain('Frontend')).toHaveAttribute('aria-expanded', 'true')
    })

    it('closes a domain alone without touching the others', async () => {
      await renderSection([backend, frontend])

      await userEvent.click(domain('Backend'))

      expect(domain('Backend')).toHaveAttribute('aria-expanded', 'false')
      expect(section().getByText('Java')).not.toBeVisible()
      expect(domain('Frontend')).toHaveAttribute('aria-expanded', 'true')
      expect(section().getByText('React')).toBeVisible()
    })

    it('offers to expand all once a domain is closed alone', async () => {
      await renderSection([backend, frontend])

      await userEvent.click(domain('Backend'))

      expect(section().getByRole('button', { name: 'Expand all' })).toBeInTheDocument()
    })

    it('labels the button in French', async () => {
      await renderSection([backend, frontend], 'fr')

      await userEvent.click(section().getByRole('button', { name: 'Tout replier' }))

      expect(section().getByRole('button', { name: 'Tout déplier' })).toBeInTheDocument()
    })
  })

  describe('with a single domain', () => {
    it('opens it once loaded', async () => {
      await renderSection([backend])

      expect(domain('Backend')).toHaveAttribute('aria-expanded', 'true')
      expect(section().getByText('Java')).toBeVisible()
    })

    it('offers no expand all or collapse all', async () => {
      await renderSection([backend])

      expect(section().queryByRole('button', { name: /all/i })).not.toBeInTheDocument()
    })
  })
})
