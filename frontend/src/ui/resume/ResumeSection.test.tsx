import { isInaccessible, render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { Locale } from '@/domain/i18n/Locale'
import type { AsyncState } from '@/ui/async/useAsync'
import { Tile } from '@/ui/components/Tile'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import { ResumeSection } from '@/ui/resume/ResumeSection'

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

      expect(section().getByRole('status')).toHaveTextContent('Loading…')
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

      expect(section().getByRole('status')).toHaveTextContent('Chargement…')
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

  describe('with an icon', () => {
    function renderWithIcon(icon: ReactNode) {
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
})
