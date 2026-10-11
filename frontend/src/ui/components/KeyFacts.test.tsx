import { render, screen, within } from '@testing-library/react'
import type { Locale } from '@/domain/i18n/Locale'
import type { ProfessionalExperience } from '@/domain/professionalExperience/ProfessionalExperience'
import type { Project } from '@/domain/project/Project'
import type { Tag, TagKind } from '@/domain/tag/Tag'
import { KeyFacts } from '@/ui/components/KeyFacts'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'

const OCTOBER_2026 = new Date('2026-10-10T12:00:00Z')
const NO_ROLE = { en: '', fr: '' }
const TECH_LEAD = { en: 'Tech lead', fr: 'Responsable technique' }

const tag = (id: number, kind: TagKind = 'skill'): Tag => ({
  id,
  name: { en: `Tag ${id}`, fr: `Étiquette ${id}` },
  kind,
})
const project = (id: number, tags: Tag[]): Project => ({
  id,
  title: { en: `Project ${id}`, fr: `Projet ${id}` },
  period: { start: '2020-01-01', end: null },
  description: { en: '', fr: '' },
  achievements: [],
  missions: [],
  tags,
})
const experience = (
  start: string,
  end: string | null,
  tags: Tag[] = [],
): ProfessionalExperience => ({
  id: 1,
  company: 'Acme',
  position: { en: 'Developer', fr: 'Développeur' },
  employmentType: 'full_time',
  companyUrl: '',
  location: { en: '', fr: '' },
  period: { start, end },
  description: { en: '', fr: '' },
  projects: tags.length > 0 ? [project(1, tags)] : [],
})

function renderFacts(
  experiences: ProfessionalExperience[],
  desiredRole = NO_ROLE,
  locale: Locale = 'en',
  chosenStack: Tag[] = [],
) {
  return render(
    <LocaleProvider initialLocale={locale}>
      <KeyFacts
        experiences={experiences}
        desiredRole={desiredRole}
        chosenStack={chosenStack}
        today={OCTOBER_2026}
      />
    </LocaleProvider>,
  )
}

const terms = () => screen.queryAllByRole('term').map((term) => term.textContent)
const definitions = () =>
  screen.queryAllByRole('definition').map((definition) => definition.textContent)

describe('KeyFacts', () => {
  it('is a region named by a "Key facts" heading', () => {
    renderFacts([experience('2015-09-01', '2024-12-31')])

    const region = screen.getByRole('region', { name: 'Key facts' })
    expect(within(region).getByRole('heading', { level: 2, name: 'Key facts' })).toBeInTheDocument()
  })

  it('shows the years of experience as "N+ years", rounding down', () => {
    renderFacts([experience('2015-09-01', '2024-12-31')])

    expect(terms()).toContain('Experience')
    expect(definitions()).toContain('9+ years')
  })

  it('says "1+ an" in French from exactly 12 months of experience', () => {
    renderFacts([experience('2025-10-01', '2026-09-30')], NO_ROLE, 'fr')

    expect(definitions()).toContain('1+ an')
  })

  it('says "1+ year" from exactly 12 months of experience', () => {
    renderFacts([experience('2025-10-01', '2026-09-30')])

    expect(definitions()).toContain('1+ year')
  })

  it('shows the position and company of the ongoing job under "Currently"', () => {
    renderFacts([experience('2020-01-01', null)], TECH_LEAD)

    expect(terms()).toContain('Currently')
    expect(definitions()).toContain('Developer at Acme')
  })

  it('shows the desired role under "Looking for" when no job is ongoing', () => {
    renderFacts([experience('2015-09-01', '2024-12-31')], TECH_LEAD)

    expect(terms()).toContain('Looking for')
    expect(terms()).not.toContain('Currently')
    expect(definitions()).toContain('Tech lead')
  })

  it('shows the desired role when the only ongoing job starts after today', () => {
    renderFacts([experience('2027-01-01', null)], TECH_LEAD)

    expect(terms()).toEqual(['Looking for'])
    expect(definitions()).toEqual(['Tech lead'])
  })

  it('prefers the ongoing job over the desired role', () => {
    renderFacts([experience('2020-01-01', null)], TECH_LEAD)

    expect(terms()).not.toContain('Looking for')
    expect(definitions()).not.toContain('Tech lead')
  })

  it('shows the main stack as at most 5 chips, labelled "Main stack"', () => {
    renderFacts([experience('2020-01-01', '2021-12-31', [1, 2, 3, 4, 5, 6, 7].map((id) => tag(id)))])

    const chips = within(screen.getByRole('list', { name: 'Main stack' })).getAllByRole('listitem')
    expect(chips.map((chip) => chip.textContent)).toEqual([
      'Tag 1',
      'Tag 2',
      'Tag 3',
      'Tag 4',
      'Tag 5',
    ])
  })

  describe('with a chosen stack', () => {
    const chips = () =>
      within(screen.getByRole('list', { name: 'Main stack' }))
        .getAllByRole('listitem')
        .map((chip) => chip.textContent)

    it('shows the chosen tags in the given order instead of the computed ranking', () => {
      renderFacts(
        [experience('2020-01-01', '2021-12-31', [tag(1), tag(2), tag(3)])],
        NO_ROLE,
        'en',
        [tag(9), tag(8), tag(7)],
      )

      expect(chips()).toEqual(['Tag 9', 'Tag 8', 'Tag 7'])
    })

    it('shows at most the first 5 chosen tags', () => {
      renderFacts([], NO_ROLE, 'en', [1, 2, 3, 4, 5, 6, 7].map((id) => tag(id)))

      expect(chips()).toEqual(['Tag 1', 'Tag 2', 'Tag 3', 'Tag 4', 'Tag 5'])
    })

    it('keeps a chosen methodology, unlike the computed ranking', () => {
      renderFacts([], NO_ROLE, 'en', [tag(1, 'skill'), tag(2, 'methodology')])

      expect(chips()).toEqual(['Tag 1', 'Tag 2'])
      expect(screen.getByText('Tag 2')).toHaveClass('tag--methodology')
    })

    it('shows the main stack even when the experiences have no tag', () => {
      renderFacts([experience('2015-09-01', '2024-12-31')], NO_ROLE, 'en', [tag(1)])

      expect(terms()).toEqual(['Experience', 'Main stack'])
    })
  })

  it('colours the stack chips by kind of tag', () => {
    renderFacts([experience('2020-01-01', '2021-12-31', [tag(1, 'skill'), tag(2, 'tool')])])

    expect(screen.getByText('Tag 1')).toHaveClass('tag--skill')
    expect(screen.getByText('Tag 2')).toHaveClass('tag--tool')
  })

  it('hides the experience under 1 year, keeping the other facts', () => {
    renderFacts([experience('2025-12-01', null, [tag(1)])])

    expect(terms()).toEqual(['Currently', 'Main stack'])
  })

  it('hides the role when no job is ongoing and no role is desired, keeping the other facts', () => {
    renderFacts([experience('2015-09-01', '2024-12-31', [tag(1)])])

    expect(terms()).toEqual(['Experience', 'Main stack'])
  })

  it('hides the main stack when there are no tags, keeping the other facts', () => {
    renderFacts([experience('2015-09-01', '2024-12-31')], TECH_LEAD)

    expect(terms()).toEqual(['Experience', 'Looking for'])
  })

  it('leaves methodologies out of the main stack, hiding it when only they remain', () => {
    renderFacts([experience('2015-09-01', '2024-12-31', [tag(1, 'methodology')])])

    expect(terms()).toEqual(['Experience'])
  })

  it('renders nothing when no fact applies', () => {
    const { container } = renderFacts([], NO_ROLE)

    expect(container).toBeEmptyDOMElement()
  })

  it('words the facts in French', () => {
    renderFacts([experience('2015-09-01', null, [tag(1)])], TECH_LEAD, 'fr')

    expect(terms()).toEqual(['Expérience', 'Actuellement', 'Stack principale'])
    expect(definitions()).toContain('11+ ans')
    expect(definitions()).toContain('Développeur chez Acme')
    expect(screen.getByRole('region', { name: 'En bref' })).toBeInTheDocument()
    expect(screen.getByText('Étiquette 1')).toBeInTheDocument()
  })

  it('shows the desired role in French under "Recherche"', () => {
    renderFacts([experience('2015-09-01', '2024-12-31')], TECH_LEAD, 'fr')

    expect(terms()).toContain('Recherche')
    expect(definitions()).toContain('Responsable technique')
  })
})
