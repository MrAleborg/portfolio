import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { isInaccessible, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState, type ReactElement } from 'react'
import type { Locale } from '@/domain/i18n/Locale'
import type { AsyncState } from '@/ui/async/useAsync'
import { Tile } from '@/ui/components/Tile'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import { HobbySection } from '@/ui/resume/HobbySection'
import { ResumeSection } from '@/ui/resume/ResumeSection'
import { TagSection } from '@/ui/resume/TagSection'
import { useSectionEntry, useSectionVariant } from '@/ui/resume/SectionContext'

interface Item {
  id: number
  name: string
}

function renderSection(state: AsyncState<Item[]>, locale: Locale = 'en') {
  return render(
    <LocaleProvider initialLocale={locale}>
      <ResumeSection
        title="Things"
        icon={<svg />}
        state={state}
        getKey={(item) => item.id}
        renderTile={(item) => <Tile title={item.name} />}
      />
    </LocaleProvider>,
  )
}

function section() {
  return within(screen.getByRole('region', { name: 'Things' }))
}

describe('ResumeSection', () => {
  it('is a region named by its level 2 heading', () => {
    renderSection({ status: 'loaded', value: [] })

    expect(
      section().getByRole('heading', { level: 2, name: 'Things' }),
    ).toBeInTheDocument()
  })

  it('shows one tile per item', () => {
    renderSection({
      status: 'loaded',
      value: [
        { id: 1, name: 'First' },
        { id: 2, name: 'Second' },
      ],
    })

    expect(section().getAllByRole('article').map((tile) => tile.textContent)).toEqual([
      'First',
      'Second',
    ])
  })

  describe('in English', () => {
    it('says the items are loading', () => {
      renderSection({ status: 'loading' })

      expect(section().getByRole('status')).toHaveTextContent('Loading Things…')
    })

    it('says when the items could not be loaded', () => {
      renderSection({ status: 'error' })

      expect(section().getByRole('alert')).toHaveTextContent(
        'This section could not be loaded. Please try again later.',
      )
    })

    it('says when there is no item', () => {
      renderSection({ status: 'loaded', value: [] })

      expect(section().getByText('Nothing to show yet.')).toBeInTheDocument()
      expect(section().queryByRole('list')).not.toBeInTheDocument()
    })
  })

  describe('in French', () => {
    it('says the items are loading', () => {
      renderSection({ status: 'loading' }, 'fr')

      expect(section().getByRole('status').textContent).toBe('Chargement\u202f: Things…')
    })

    it('says when the items could not be loaded', () => {
      renderSection({ status: 'error' }, 'fr')

      expect(section().getByRole('alert')).toHaveTextContent(
        'Cette section n’a pas pu être chargée. Réessayez plus tard.',
      )
    })

    it('says when there is no item', () => {
      renderSection({ status: 'loaded', value: [] }, 'fr')

      expect(section().getByText('Rien à afficher pour le moment.')).toBeInTheDocument()
    })
  })

  describe('while loading', () => {
    function renderLoading(
      props: {
        variant?: 'card' | 'row'
        singleColumn?: boolean
        placeholderCount?: number
        locale?: Locale
      } = {},
    ) {
      const { locale = 'en', ...sectionProps } = props
      return render(
        <LocaleProvider initialLocale={locale}>
          <ResumeSection
            title="Things"
            icon={<svg />}
            state={{ status: 'loading' }}
            getKey={(item: Item) => item.id}
            renderTile={(item: Item) => <Tile title={item.name} />}
            {...sectionProps}
          />
        </LocaleProvider>,
      )
    }

    /** The part of the placeholders that assistive technology skips. */
    function hiddenSkeleton() {
      const container = screen
        .getByRole('region', { name: 'Things' })
        .querySelector('div[aria-hidden="true"]')
      if (!container) throw new Error('No aria-hidden placeholders in the section')
      return container
    }

    it('still shows the title right away', () => {
      renderLoading()

      expect(section().getByRole('heading', { level: 2, name: 'Things' })).toBeInTheDocument()
    })

    it('announces the loading with visually hidden text', () => {
      renderLoading()

      expect(section().getByRole('status')).toHaveTextContent('Loading Things…')
      expect(section().getByText('Loading Things…')).toHaveClass('visually-hidden')
    })

    it('announces the loading in French with visually hidden text', () => {
      renderLoading({ locale: 'fr' })

      expect(section().getByText('Chargement\u202f: Things…')).toHaveClass('visually-hidden')
    })

    it('shows two card placeholders in a card section', () => {
      renderLoading()

      expect(hiddenSkeleton().querySelectorAll('li')).toHaveLength(2)
    })

    it('shows three row placeholders in a row section', () => {
      renderLoading({ variant: 'row' })

      expect(hiddenSkeleton().querySelectorAll('li')).toHaveLength(3)
    })

    it('shows as many card placeholders as asked', () => {
      renderLoading({ placeholderCount: 1 })

      expect(hiddenSkeleton().querySelectorAll('li')).toHaveLength(1)
    })

    it('shows as many row placeholders as asked', () => {
      renderLoading({ variant: 'row', placeholderCount: 5 })

      expect(hiddenSkeleton().querySelectorAll('li')).toHaveLength(5)
    })

    it('lays the card placeholders out like the tiles', () => {
      renderLoading()

      expect(hiddenSkeleton().querySelector('.tile-list')).not.toHaveClass('tile-list--single')
    })

    it('stacks the card placeholders of a single column section', () => {
      renderLoading({ singleColumn: true })

      expect(hiddenSkeleton().querySelector('.tile-list')).toHaveClass('tile-list--single')
    })

    it('stacks the card placeholders of a section with its own rendering', () => {
      render(
        <LocaleProvider initialLocale="en">
          <ResumeSection
            title="Things"
            icon={<svg />}
            state={{ status: 'loading' }}
            renderItems={() => null}
          />
        </LocaleProvider>,
      )

      expect(hiddenSkeleton().querySelector('.tile-list')).toHaveClass('tile-list--single')
    })

    it('keeps the placeholders out of the status', () => {
      renderLoading()

      expect(section().getByRole('status').querySelector('[aria-hidden]')).toBeNull()
      expect(hiddenSkeleton()).toBeInTheDocument()
    })

    it('adds the loading text to a status already in the page, so it gets announced', () => {
      const added: string[] = []
      const observer = new MutationObserver(() => {})
      observer.observe(document.body, { childList: true, subtree: true })

      renderLoading()

      // A region that holds text from the moment it appears is not announced by many
      // screen readers; the text has to be added inside it afterwards.
      for (const record of observer.takeRecords()) {
        const inStatus = (record.target as Element).closest?.('[role="status"]')
        if (inStatus) added.push(...[...record.addedNodes].map((node) => node.textContent ?? ''))
      }
      observer.disconnect()
      expect(added.join('')).toContain('Loading Things…')
    })

    it('empties the status when the loading ends in an error', () => {
      const { rerender } = renderLoading()

      rerender(
        <LocaleProvider initialLocale="en">
          <ResumeSection
            title="Things"
            icon={<svg />}
            state={{ status: 'error' }}
            getKey={(item: Item) => item.id}
            renderTile={(item: Item) => <Tile title={item.name} />}
          />
        </LocaleProvider>,
      )

      expect(section().getByRole('status')).toBeEmptyDOMElement()
      expect(section().getByRole('alert')).toBeInTheDocument()
    })

    it('is not mistaken for entries', () => {
      renderLoading()

      expect(section().queryByRole('article', { hidden: true })).not.toBeInTheDocument()
      expect(section().queryByRole('button', { hidden: true })).not.toBeInTheDocument()
      expect(section().getAllByRole('heading', { hidden: true })).toHaveLength(1)
    })

    it('gives way to the entries once loaded', () => {
      const { rerender } = renderLoading()

      rerender(
        <LocaleProvider initialLocale="en">
          <ResumeSection
            title="Things"
            icon={<svg />}
            state={{ status: 'loaded', value: [{ id: 1, name: 'First' }] }}
            getKey={(item: Item) => item.id}
            renderTile={(item: Item) => <Tile title={item.name} />}
          />
        </LocaleProvider>,
      )

      expect(section().getByRole('status')).toBeEmptyDOMElement()
      expect(section().getByRole('article')).toHaveTextContent('First')
    })

    describe('in sections shown as a single block', () => {
      const neverLoads = { list: () => new Promise<never>(() => {}) }

      it('shows one placeholder while the expertise loads', () => {
        render(
          <LocaleProvider initialLocale="en">
            <TagSection repository={neverLoads} />
          </LocaleProvider>,
        )

        expect(
          screen
            .getByRole('region', { name: 'Expertise' })
            .querySelectorAll('div[aria-hidden="true"] li'),
        ).toHaveLength(1)
      })

      it('shows one placeholder while the hobbies load', () => {
        render(
          <LocaleProvider initialLocale="en">
            <HobbySection repository={neverLoads} />
          </LocaleProvider>,
        )

        expect(
          screen
            .getByRole('region', { name: 'Hobbies' })
            .querySelectorAll('div[aria-hidden="true"] li'),
        ).toHaveLength(1)
      })
    })

    describe('styles', () => {
      const css = readFileSync(join(import.meta.dirname, 'SectionSkeleton.css'), 'utf8').replace(
        /\/\*[\s\S]*?\*\//g,
        '',
      )

      it('pulses slowly', () => {
        expect(css).toMatch(/animation:[^;]*1\.6s\s+ease-in-out\s+infinite/)
      })

      it('does not animate when the reader prefers reduced motion', () => {
        expect(css).toMatch(
          /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[^}]*animation:\s*none/,
        )
      })
    })
  })

  describe('with an icon', () => {
    function renderWithIcon(icon: ReactElement) {
      return render(
        <LocaleProvider initialLocale="en">
          <ResumeSection
            title="Things"
            icon={icon}
            state={{ status: 'loaded', value: [] }}
            getKey={(item: Item) => item.id}
            renderTile={(item: Item) => <Tile title={item.name} />}
          />
        </LocaleProvider>,
      )
    }

    it('shows it inside the heading, hidden from assistive technology', () => {
      renderWithIcon(<svg data-testid="icon" />)

      const heading = section().getByRole('heading', { level: 2 })
      const icon = within(heading).getByTestId('icon')
      expect(isInaccessible(icon)).toBe(true)
    })

    it('keeps the title alone as the heading name', () => {
      renderWithIcon(<svg data-testid="icon" role="img" aria-label="Decoration" />)

      expect(screen.getByTestId('icon')).toBeInTheDocument()
      expect(section().getByRole('heading', { level: 2, name: 'Things' })).toBeInTheDocument()
    })
  })

  describe('with its own rendering of the items', () => {
    function renderWithItems(state: AsyncState<Item[]>) {
      return render(
        <LocaleProvider initialLocale="en">
          <ResumeSection
            title="Things"
            icon={<svg />}
            state={state}
            renderItems={(items) => <p>{items.map((item) => item.name).join(' and ')}</p>}
          />
        </LocaleProvider>,
      )
    }

    it('shows it instead of the tiles once loaded', () => {
      renderWithItems({
        status: 'loaded',
        value: [
          { id: 1, name: 'First' },
          { id: 2, name: 'Second' },
        ],
      })

      expect(section().getByText('First and Second')).toBeInTheDocument()
      expect(section().queryByRole('list')).toBeNull()
    })

    it('still says there is nothing to show when there are no items', () => {
      renderWithItems({ status: 'loaded', value: [] })

      expect(section().getByText('Nothing to show yet.')).toBeInTheDocument()
    })

    it('still says it is loading', () => {
      renderWithItems({ status: 'loading' })

      expect(section().getByRole('status')).toBeInTheDocument()
    })
  })

  describe('with expandable entries', () => {
    /** Stands in for a tile: a toggle that follows the section's expand and collapse commands. */
    function Entry({ name, initiallyOpen = false }: { name: string; initiallyOpen?: boolean }) {
      const [expanded, setExpanded] = useSectionEntry(initiallyOpen)
      return (
        <button type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
          {name}
        </button>
      )
    }

    function renderEntries(
      entries: { name: string; initiallyOpen?: boolean }[],
      locale: Locale = 'en',
      variant?: 'card' | 'row',
    ) {
      return render(
        <LocaleProvider initialLocale={locale}>
          <ResumeSection
            title="Things"
            icon={<svg />}
            state={{ status: 'loaded', value: entries }}
            variant={variant}
            renderItems={(items) =>
              items.map((item) => <Entry key={item.name} {...item} />)
            }
          />
        </LocaleProvider>,
      )
    }

    function entry(name: string) {
      return section().getByRole('button', { name })
    }

    it('offers no expand all with a single entry', () => {
      renderEntries([{ name: 'First' }])

      expect(section().queryByRole('button', { name: /all/i })).not.toBeInTheDocument()
    })

    it('offers no expand all with no entry', () => {
      renderEntries([])

      expect(section().queryByRole('button', { name: /all/i })).not.toBeInTheDocument()
    })

    it('offers to expand all when the entries are closed', () => {
      renderEntries([{ name: 'First' }, { name: 'Second' }])

      expect(section().getByRole('button', { name: 'Expand all' })).toBeInTheDocument()
    })

    it('offers to expand all when only some entries are open', () => {
      renderEntries([{ name: 'First', initiallyOpen: true }, { name: 'Second' }])

      expect(section().getByRole('button', { name: 'Expand all' })).toBeInTheDocument()
    })

    it('offers to collapse all when every entry is open', () => {
      renderEntries([
        { name: 'First', initiallyOpen: true },
        { name: 'Second', initiallyOpen: true },
      ])

      expect(section().getByRole('button', { name: 'Collapse all' })).toBeInTheDocument()
    })

    it('opens every entry when expanding all', async () => {
      renderEntries([{ name: 'First' }, { name: 'Second', initiallyOpen: true }, { name: 'Third' }])

      await userEvent.click(section().getByRole('button', { name: 'Expand all' }))

      for (const name of ['First', 'Second', 'Third']) {
        expect(entry(name)).toHaveAttribute('aria-expanded', 'true')
      }
      expect(section().getByRole('button', { name: 'Collapse all' })).toBeInTheDocument()
    })

    it('closes every entry when collapsing all', async () => {
      renderEntries([
        { name: 'First', initiallyOpen: true },
        { name: 'Second', initiallyOpen: true },
      ])

      await userEvent.click(section().getByRole('button', { name: 'Collapse all' }))

      for (const name of ['First', 'Second']) {
        expect(entry(name)).toHaveAttribute('aria-expanded', 'false')
      }
      expect(section().getByRole('button', { name: 'Expand all' })).toBeInTheDocument()
    })

    it('switches to collapse all once the last closed entry is opened', async () => {
      renderEntries([{ name: 'First', initiallyOpen: true }, { name: 'Second' }])

      await userEvent.click(entry('Second'))

      expect(section().getByRole('button', { name: 'Collapse all' })).toBeInTheDocument()
    })

    it('switches to expand all once an entry is closed', async () => {
      renderEntries([
        { name: 'First', initiallyOpen: true },
        { name: 'Second', initiallyOpen: true },
      ])

      await userEvent.click(entry('First'))

      expect(section().getByRole('button', { name: 'Expand all' })).toBeInTheDocument()
    })

    it('lets an entry still be toggled alone after expanding all', async () => {
      renderEntries([{ name: 'First' }, { name: 'Second' }])
      await userEvent.click(section().getByRole('button', { name: 'Expand all' }))

      await userEvent.click(entry('First'))

      expect(entry('First')).toHaveAttribute('aria-expanded', 'false')
      expect(entry('Second')).toHaveAttribute('aria-expanded', 'true')
    })

    it('describes the button by the section title', () => {
      renderEntries([{ name: 'First' }, { name: 'Second' }])

      expect(section().getByRole('button', { name: 'Expand all' })).toHaveAccessibleDescription(
        'Things',
      )
    })

    it('keeps the button out of the heading', () => {
      renderEntries([{ name: 'First' }, { name: 'Second' }])

      const heading = section().getByRole('heading', { level: 2 })
      expect(within(heading).queryByRole('button')).not.toBeInTheDocument()
    })

    it('labels the button in French', async () => {
      renderEntries([{ name: 'First' }, { name: 'Second' }], 'fr')

      await userEvent.click(section().getByRole('button', { name: 'Tout déplier' }))

      expect(section().getByRole('button', { name: 'Tout replier' })).toBeInTheDocument()
    })

    it('stops offering expand all once entries go away and fewer than two remain', async () => {
      function RemovableEntries() {
        const [showSecond, setShowSecond] = useState(true)
        return (
          <>
            <Entry name="First" />
            {showSecond && <Entry name="Second" />}
            <button type="button" onClick={() => setShowSecond(false)}>
              Remove second
            </button>
          </>
        )
      }
      render(
        <LocaleProvider initialLocale="en">
          <ResumeSection
            title="Things"
            icon={<svg />}
            state={{ status: 'loaded', value: [{ id: 1 }] }}
            renderItems={() => <RemovableEntries />}
          />
        </LocaleProvider>,
      )
      expect(section().getByRole('button', { name: 'Expand all' })).toBeInTheDocument()

      await userEvent.click(section().getByRole('button', { name: 'Remove second' }))

      expect(section().queryByRole('button', { name: /all/i })).not.toBeInTheDocument()
    })

    it('lets an entry outside any section toggle on its own', async () => {
      render(<Entry name="Alone" />)

      await userEvent.click(screen.getByRole('button', { name: 'Alone' }))

      expect(screen.getByRole('button', { name: 'Alone' })).toHaveAttribute('aria-expanded', 'true')
    })
  })

  describe('variant', () => {
    /** Shows the variant the entries of the section get. */
    function Variant() {
      return <p>{useSectionVariant()}</p>
    }

    function renderVariant(variant?: 'card' | 'row') {
      return render(
        <LocaleProvider initialLocale="en">
          <ResumeSection
            title="Things"
            icon={<svg />}
            state={{ status: 'loaded', value: [{ id: 1 }] }}
            variant={variant}
            renderItems={() => <Variant />}
          />
        </LocaleProvider>,
      )
    }

    it('marks a row section', () => {
      renderVariant('row')

      expect(screen.getByRole('region', { name: 'Things' })).toHaveClass('resume-section--row')
    })

    it('is a card section by default', () => {
      renderVariant()

      expect(screen.getByRole('region', { name: 'Things' })).not.toHaveClass('resume-section--row')
    })

    it('gives its entries the card variant by default', () => {
      renderVariant()

      expect(section().getByText('card')).toBeInTheDocument()
    })

    it('gives its entries the row variant in a row section', () => {
      renderVariant('row')

      expect(section().getByText('row')).toBeInTheDocument()
    })

    it('is card for an entry outside any section', () => {
      render(<Variant />)

      expect(screen.getByText('card')).toBeInTheDocument()
    })
  })
})
