import { render, screen, within } from '@testing-library/react'
import type { Locale } from '@/domain/i18n/Locale'
import type { Tag } from '@/domain/tag/Tag'
import { TagGroup, TagList } from '@/ui/components/TagList'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'

const python: Tag = { id: 1, name: { en: 'Python', fr: 'Python' }, kind: 'skill' }
const git: Tag = { id: 2, name: { en: 'Git', fr: 'Git' }, kind: 'tool' }
const agile: Tag = { id: 3, name: { en: 'Agile', fr: 'Agile' }, kind: 'methodology' }
const testing: Tag = { id: 4, name: { en: 'Testing', fr: 'Tests' }, kind: 'skill' }

function renderTags(tags: Tag[], locale: Locale = 'en') {
  return render(
    <LocaleProvider initialLocale={locale}>
      <TagList tags={tags} />
    </LocaleProvider>,
  )
}

function chips(group: string) {
  return within(screen.getByRole('list', { name: group }))
    .getAllByRole('listitem')
    .map((chip) => chip.textContent)
}

describe('TagList', () => {
  it('groups the tags by kind, each group named in English', () => {
    renderTags([python, git, agile])

    expect(screen.getAllByRole('list')).toHaveLength(3)
    expect(screen.getByRole('list', { name: 'Skills' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Tools' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Methodologies' })).toBeInTheDocument()
  })

  it('names the groups in French', () => {
    renderTags([python, git, agile], 'fr')

    expect(screen.getByRole('list', { name: 'Compétences' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Outils' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Méthodologies' })).toBeInTheDocument()
  })

  it('shows the tag names in the language of the page', () => {
    renderTags([testing], 'fr')

    expect(chips('Compétences')).toEqual(['Tests'])
  })

  it('orders the groups skills, tools, methodologies whatever the input order', () => {
    renderTags([agile, git, python])

    const names = screen
      .getAllByRole('list')
      .map((list) => list.getAttribute('aria-labelledby'))
      .map((id) => document.getElementById(id!)?.textContent)
    expect(names).toEqual(['Skills', 'Tools', 'Methodologies'])
  })

  it('puts each tag in its group, keeping the input order within a group', () => {
    renderTags([testing, git, python, agile])

    expect(chips('Skills')).toEqual(['Testing', 'Python'])
    expect(chips('Tools')).toEqual(['Git'])
    expect(chips('Methodologies')).toEqual(['Agile'])
  })

  it('leaves out the kinds without tags', () => {
    renderTags([git])

    expect(screen.getAllByRole('list')).toHaveLength(1)
    expect(screen.getByRole('list', { name: 'Tools' })).toBeInTheDocument()
  })

  it('shows nothing without tags', () => {
    const { container } = renderTags([])

    expect(container).toBeEmptyDOMElement()
  })

  it('styles the skill chips as skills', () => {
    renderTags([python, testing])

    const skills = within(screen.getByRole('list', { name: 'Skills' })).getAllByRole('listitem')
    skills.forEach((chip) => expect(chip).toHaveClass('tag', 'tag--skill'))
  })

  it('styles the tool chips as tools', () => {
    renderTags([git])

    const [chip] = within(screen.getByRole('list', { name: 'Tools' })).getAllByRole('listitem')
    expect(chip).toHaveClass('tag', 'tag--tool')
  })

  it('styles the methodology chips as methodologies', () => {
    renderTags([agile])

    const [chip] = within(screen.getByRole('list', { name: 'Methodologies' })).getAllByRole('listitem')
    expect(chip).toHaveClass('tag', 'tag--methodology')
  })
})

describe('TagGroup', () => {
  it('shows neutral chips, with no kind style, when it has no kind', () => {
    render(
      <LocaleProvider initialLocale="en">
        <TagGroup label="Expertise" tags={[{ id: 1, name: { en: 'Backend', fr: 'Backend' } }]} />
      </LocaleProvider>,
    )

    const [chip] = within(screen.getByRole('list', { name: 'Expertise' })).getAllByRole('listitem')
    expect(chip).toHaveClass('tag')
    expect(chip.className).not.toMatch(/tag--/)
  })
})
