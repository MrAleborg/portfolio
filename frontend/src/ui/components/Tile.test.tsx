import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { Tile } from '@/ui/components/Tile'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import { ResumeSection } from '@/ui/resume/ResumeSection'

function renderTileWithContent() {
  return render(
    <Tile title="Master’s degree">
      <p>Thesis on compilers.</p>
    </Tile>,
  )
}

/** The meta items of the only tile on screen; an empty one is invisible in the text. */
function metaItems() {
  return screen.getByRole('article').querySelectorAll('.tile__meta > span')
}

function renderInSection(
  tiles: ReactElement<{ title: string }>[],
  variant: 'card' | 'row' = 'card',
) {
  return render(
    <LocaleProvider initialLocale="en">
      <ResumeSection
        title="Things"
        icon={<svg />}
        variant={variant}
        state={{ status: 'loaded', value: tiles }}
        getKey={(tile) => tile.props.title}
        renderTile={(tile) => tile}
      />
    </LocaleProvider>,
  )
}

/** A Web Animation that runs until the test finishes it, like a browser one would. */
class FakeAnimation {
  onfinish: (() => void) | null = null
  target: Element
  keyframes: unknown
  options: KeyframeAnimationOptions
  private ended = false

  constructor(target: Element, keyframes: unknown, options: KeyframeAnimationOptions) {
    this.target = target
    this.keyframes = keyframes
    this.options = options
  }

  /** Does nothing once cancelled or finished, as a browser's animation. */
  finish() {
    if (this.ended) return
    this.ended = true
    this.onfinish?.()
  }

  /** A cancelled animation never fires its finish event. */
  cancel() {
    this.ended = true
  }
}

/** Makes `element.animate` available, as in a browser, and keeps what it started. */
function stubAnimate() {
  const animations: FakeAnimation[] = []
  Object.defineProperty(Element.prototype, 'animate', {
    configurable: true,
    writable: true,
    value(this: Element, keyframes: unknown, options: KeyframeAnimationOptions) {
      const animation = new FakeAnimation(this, keyframes, options)
      animations.push(animation)
      return animation
    },
  })
  return animations
}

async function finishAll(animations: FakeAnimation[]) {
  await act(async () => {
    animations.forEach((animation) => animation.finish())
  })
}

/**
 * jsdom has no layout: gives each card the height its current layout would have, a title
 * of 40px plus 200px of details or 60px of preview, or nothing at all inside a hidden parent.
 */
function stubLayout(previewHeight = { current: 60 }) {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: Element,
  ) {
    const shown = (selector: string) => {
      const element = this.querySelector<HTMLElement>(`:scope > ${selector}`)
      return element !== null && !element.hidden
    }
    const height = this.closest('[hidden]')
      ? 0
      : 40 + (shown('.tile__body') ? 200 : 0) + (shown('.tile__preview') ? previewHeight.current : 0)
    return { height } as DOMRect
  })
}

/** The height keyframes of the animation of the card of the tile with this title. */
function cardKeyframes(animations: FakeAnimation[], title: string) {
  const card = screen.getByRole('article', { name: title, hidden: true })
  return animations.find((animation) => animation.target === card)?.keyframes
}

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduce && query === '(prefers-reduced-motion: reduce)',
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }))
}

function renderOpenTile() {
  return render(
    <Tile title="Master’s degree" preview={<p>First lines.</p>} defaultExpanded>
      <p>Thesis on compilers.</p>
    </Tile>,
  )
}

const defaultMatchMedia = window.matchMedia

describe('Tile', () => {
  it('is an article named by its title', () => {
    render(<Tile title="Master’s degree" />)

    expect(
      screen.getByRole('article', { name: 'Master’s degree' }),
    ).toBeInTheDocument()
  })

  it('is described by the element it points to', () => {
    render(
      <>
        <p id="when">Sep 2015 – Jun 2017</p>
        <Tile title="Master’s degree" describedBy="when" />
      </>,
    )

    expect(screen.getByRole('article')).toHaveAccessibleDescription('Sep 2015 – Jun 2017')
  })

  it('shows its title as a level 3 heading', () => {
    render(<Tile title="Master’s degree" />)

    expect(
      screen.getByRole('heading', { level: 3, name: 'Master’s degree' }),
    ).toBeInTheDocument()
  })

  it('shows its subtitle', () => {
    render(<Tile title="Master’s degree" subtitle="Université de Rennes" />)

    expect(screen.getByText('Université de Rennes')).toBeInTheDocument()
  })

  it('shows each meta item as its own element, without a separator', () => {
    render(<Tile title="Master’s degree" meta={['Sep 2015 – Jun 2017', 'Brittany']} />)

    expect(screen.getByText('Sep 2015 – Jun 2017')).toBeInTheDocument()
    expect(screen.getByText('Brittany')).toBeInTheDocument()
    expect(screen.getByRole('article')).toHaveTextContent(
      /^Master’s degreeSep 2015 – Jun 2017 Brittany$/,
    )
  })

  it('keeps its meta items apart in its text', () => {
    render(<Tile title="Master’s degree" meta={['Sep 2015 – Jun 2017', 'Brittany']} />)

    expect(screen.getByRole('article')).toHaveTextContent('Sep 2015 – Jun 2017 Brittany')
  })

  it('leaves out empty meta items', () => {
    render(<Tile title="Master’s degree" meta={['Sep 2015 – Jun 2017', '']} />)

    expect(screen.getByText('Sep 2015 – Jun 2017')).toBeInTheDocument()
    expect(metaItems()).toHaveLength(1)
  })

  it('hides its content until the title is clicked', () => {
    renderTileWithContent()

    expect(
      screen.getByRole('button', { name: 'Master’s degree' }),
    ).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('Thesis on compilers.')).not.toBeVisible()
  })

  it('shows its content when the title is clicked', async () => {
    const user = userEvent.setup()
    renderTileWithContent()

    await user.click(screen.getByRole('button', { name: 'Master’s degree' }))

    expect(
      screen.getByRole('button', { name: 'Master’s degree' }),
    ).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Thesis on compilers.')).toBeVisible()
  })

  it('hides its content again when the title is clicked twice', async () => {
    const user = userEvent.setup()
    renderTileWithContent()

    await user.click(screen.getByRole('button', { name: 'Master’s degree' }))
    await user.click(screen.getByRole('button', { name: 'Master’s degree' }))

    expect(
      screen.getByRole('button', { name: 'Master’s degree' }),
    ).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('Thesis on compilers.')).not.toBeVisible()
  })

  it('tells which content its title expands', () => {
    renderTileWithContent()

    const button = screen.getByRole('button', { name: 'Master’s degree' })
    const content = document.getElementById(button.getAttribute('aria-controls')!)
    expect(content).toContainElement(screen.getByText('Thesis on compilers.'))
  })

  it('keeps its title the heading of the tile when it can expand', () => {
    renderTileWithContent()

    expect(
      screen.getByRole('heading', { level: 3, name: 'Master’s degree' }),
    ).toContainElement(screen.getByRole('button', { name: 'Master’s degree' }))
    expect(screen.getByRole('article')).toHaveAccessibleName('Master’s degree')
  })

  it('shows its title as a level 4 heading when nested, still named and expandable', async () => {
    render(
      <Tile title="Project" headingLevel={4}>
        <p>Details.</p>
      </Tile>,
    )

    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 4, name: 'Project' })).toBeInTheDocument()
    expect(screen.getByRole('article')).toHaveAccessibleName('Project')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Project' }))
    expect(screen.getByText('Details.')).toBeVisible()
  })

  it('looks nested only when its title is a level 4 heading', () => {
    const { rerender } = render(<Tile title="Project" />)
    expect(screen.getByRole('article')).not.toHaveClass('tile--nested')

    rerender(<Tile title="Project" headingLevel={4} />)
    expect(screen.getByRole('article')).toHaveClass('tile--nested')
  })

  it('has no button when it has no content to expand', () => {
    render(<Tile title="Master’s degree" subtitle="Université de Rennes" />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('has no button when its content is an empty list', () => {
    render(<Tile title="Master’s degree">{[]}</Tile>)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('has no button when its content is only empty values', () => {
    render(
      <Tile title="Master’s degree">
        {''}
        {null}
        {false}
      </Tile>,
    )

    expect(screen.getByRole('article')).toHaveAccessibleName('Master’s degree')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows nothing but its title when it has nothing else', () => {
    render(<Tile title="Master’s degree" meta={['']} />)

    expect(screen.getByRole('article')).toHaveTextContent(/^Master’s degree$/)
    expect(metaItems()).toHaveLength(0)
  })

  describe('preview', () => {
    it('shows its preview while closed and replaces it with the content once opened', async () => {
      const user = userEvent.setup()
      render(
        <Tile title="Master’s degree" preview={<p>First lines.</p>}>
          <p>Thesis on compilers.</p>
        </Tile>,
      )

      expect(screen.getByText('First lines.')).toBeVisible()

      await user.click(screen.getByRole('button', { name: 'Master’s degree' }))

      expect(screen.getByText('First lines.')).not.toBeVisible()
      expect(screen.getByText('Thesis on compilers.')).toBeVisible()
    })

    it('shows its preview again once closed again', async () => {
      const user = userEvent.setup()
      render(
        <Tile title="Master’s degree" preview={<p>First lines.</p>}>
          <p>Thesis on compilers.</p>
        </Tile>,
      )

      await user.click(screen.getByRole('button', { name: 'Master’s degree' }))
      await user.click(screen.getByRole('button', { name: 'Master’s degree' }))

      expect(screen.getByText('First lines.')).toBeVisible()
    })

    it('shows no preview when it has no content to expand', () => {
      render(<Tile title="Master’s degree" preview={<p>First lines.</p>} />)

      expect(screen.queryByText('First lines.')).not.toBeInTheDocument()
    })
  })

  describe('motion', () => {
    afterEach(() => {
      delete (Element.prototype as Partial<Element>).animate
      vi.stubGlobal('matchMedia', defaultMatchMedia)
      vi.restoreAllMocks()
    })

    it('shows its details at once when opened', async () => {
      const user = userEvent.setup()
      stubAnimate()
      renderTileWithContent()

      await user.click(screen.getByRole('button', { name: 'Master’s degree' }))

      expect(
        screen.getByRole('button', { name: 'Master’s degree' }),
      ).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByText('Thesis on compilers.')).toBeVisible()
    })

    it('animates its card and fades its details for 200 ms, ease-out, when opened', async () => {
      const user = userEvent.setup()
      const animations = stubAnimate()
      renderTileWithContent()

      await user.click(screen.getByRole('button', { name: 'Master’s degree' }))

      const details = screen.getByText('Thesis on compilers.').parentElement
      expect(animations.map((animation) => animation.target)).toEqual(
        expect.arrayContaining([screen.getByRole('article'), details]),
      )
      animations.forEach((animation) =>
        expect(animation.options).toMatchObject({ duration: 200, easing: 'ease-out' }),
      )
    })

    it('keeps its details visible while it closes, then hides them and brings the preview back', async () => {
      const user = userEvent.setup()
      const animations = stubAnimate()
      renderOpenTile()

      await user.click(screen.getByRole('button', { name: 'Master’s degree' }))

      expect(screen.getByText('Thesis on compilers.')).toBeVisible()

      await finishAll(animations)

      expect(screen.getByText('Thesis on compilers.')).not.toBeVisible()
      expect(screen.getByText('First lines.')).toBeVisible()
    })

    it('hides its details at once when closed with reduced motion', async () => {
      const user = userEvent.setup()
      stubAnimate()
      stubReducedMotion(true)
      renderOpenTile()

      await user.click(screen.getByRole('button', { name: 'Master’s degree' }))

      expect(screen.getByText('Thesis on compilers.')).not.toBeVisible()
      expect(screen.getByText('First lines.')).toBeVisible()
    })

    it('hides its details at once when closed in a browser without element.animate', async () => {
      const user = userEvent.setup()
      expect(Element.prototype.animate).toBeUndefined()
      renderOpenTile()

      await user.click(screen.getByRole('button', { name: 'Master’s degree' }))

      expect(screen.getByText('Thesis on compilers.')).not.toBeVisible()
      expect(screen.getByText('First lines.')).toBeVisible()
    })

    it('ends open when reopened while it closes', async () => {
      const user = userEvent.setup()
      const animations = stubAnimate()
      renderOpenTile()

      await user.click(screen.getByRole('button', { name: 'Master’s degree' }))
      await user.click(screen.getByRole('button', { name: 'Master’s degree' }))
      await finishAll(animations)

      expect(
        screen.getByRole('button', { name: 'Master’s degree' }),
      ).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByText('Thesis on compilers.')).toBeVisible()
    })

    it('ends closed when closed again while it opens', async () => {
      const user = userEvent.setup()
      const animations = stubAnimate()
      render(
        <Tile title="Master’s degree" preview={<p>First lines.</p>}>
          <p>Thesis on compilers.</p>
        </Tile>,
      )

      await user.click(screen.getByRole('button', { name: 'Master’s degree' }))
      await user.click(screen.getByRole('button', { name: 'Master’s degree' }))
      await finishAll(animations)

      expect(
        screen.getByRole('button', { name: 'Master’s degree' }),
      ).toHaveAttribute('aria-expanded', 'false')
      expect(screen.getByText('Thesis on compilers.')).not.toBeVisible()
      expect(screen.getByText('First lines.')).toBeVisible()
    })

    it('fades its details in from 0 to 1 when opened and out from 1 to 0 when closed', async () => {
      const user = userEvent.setup()
      const animations = stubAnimate()
      renderTileWithContent()
      const details = screen.getByText('Thesis on compilers.').parentElement
      const fadeOf = () =>
        animations.filter((animation) => animation.target === details).map((a) => a.keyframes)

      await user.click(screen.getByRole('button', { name: 'Master’s degree' }))
      await finishAll(animations)
      await user.click(screen.getByRole('button', { name: 'Master’s degree' }))

      expect(fadeOf()).toEqual([{ opacity: [0, 1] }, { opacity: [1, 0] }])
    })

    it('slides its card from its closed height to its open height when opened', async () => {
      const user = userEvent.setup()
      const animations = stubAnimate()
      stubLayout()
      render(
        <Tile title="Master’s degree" preview={<p>First lines.</p>}>
          <p>Thesis on compilers.</p>
        </Tile>,
      )

      await user.click(screen.getByRole('button', { name: 'Master’s degree' }))

      expect(cardKeyframes(animations, 'Master’s degree')).toEqual({
        height: ['100px', '240px'],
      })
    })

    it('slides its card from its open height to its closed height when closed', async () => {
      const user = userEvent.setup()
      const animations = stubAnimate()
      stubLayout()
      renderOpenTile()

      await user.click(screen.getByRole('button', { name: 'Master’s degree' }))

      expect(cardKeyframes(animations, 'Master’s degree')).toEqual({
        height: ['240px', '100px'],
      })
    })

    it('opens from its closed height as it is when clicked, not as it was when last drawn', async () => {
      const user = userEvent.setup()
      const animations = stubAnimate()
      const previewHeight = { current: 60 }
      stubLayout(previewHeight)
      render(
        <Tile title="Master’s degree" preview={<p>First lines.</p>}>
          <p>Thesis on compilers.</p>
        </Tile>,
      )

      previewHeight.current = 80 // e.g. the window got narrower, or a font finished loading
      await user.click(screen.getByRole('button', { name: 'Master’s degree' }))

      expect(cardKeyframes(animations, 'Master’s degree')).toEqual({
        height: ['120px', '240px'],
      })
    })

    it('opens a tile nested in a closed tile from its own closed height, not from nothing', async () => {
      const user = userEvent.setup()
      const animations = stubAnimate()
      stubLayout()
      render(
        <Tile title="Job">
          <Tile title="Project" headingLevel={4} preview={<p>Project lines.</p>}>
            <p>Project details.</p>
          </Tile>
        </Tile>,
      )
      await user.click(screen.getByRole('button', { name: 'Job' }))
      await finishAll(animations)

      await user.click(screen.getByRole('button', { name: 'Project' }))

      expect(cardKeyframes(animations, 'Project')).toEqual({ height: ['100px', '240px'] })
    })

    it('keeps its links out of reach while its details fade out', async () => {
      const user = userEvent.setup()
      const animations = stubAnimate()
      render(
        <Tile title="Master’s degree" defaultExpanded>
          <a href="https://example.org">Thesis</a>
        </Tile>,
      )
      const details = screen.getByRole('link', { name: 'Thesis' }).parentElement
      expect(details).not.toHaveAttribute('inert')

      await user.click(screen.getByRole('button', { name: 'Master’s degree' }))

      expect(details).toHaveAttribute('inert')

      await user.click(screen.getByRole('button', { name: 'Master’s degree' }))
      await finishAll(animations)

      expect(details).not.toHaveAttribute('inert')
    })

    it('clips its card only vertically, and only while it animates', async () => {
      const user = userEvent.setup()
      const animations = stubAnimate()
      renderTileWithContent()

      await user.click(screen.getByRole('button', { name: 'Master’s degree' }))

      const card = screen.getByRole('article')
      expect(card.style.overflowY).toBe('clip')
      expect(card.style.overflowX).toBe('')

      await finishAll(animations)

      expect(card.style.overflowY).toBe('')
    })

    it('can be removed while it closes, without error', async () => {
      const user = userEvent.setup()
      const animations = stubAnimate()
      const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { unmount } = renderOpenTile()

      await user.click(screen.getByRole('button', { name: 'Master’s degree' }))
      unmount()
      await finishAll(animations)

      expect(logged).not.toHaveBeenCalled()
    })

    it('keeps the details of every tile visible while expand all and collapse all animate', async () => {
      const user = userEvent.setup()
      const animations = stubAnimate()
      renderInSection([
        <Tile key="a" title="First">
          <p>First details.</p>
        </Tile>,
        <Tile key="b" title="Second">
          <p>Second details.</p>
        </Tile>,
      ])

      await user.click(screen.getByRole('button', { name: 'Expand all' }))

      expect(animations.map((animation) => animation.target)).toEqual(
        expect.arrayContaining([
          screen.getByRole('article', { name: 'First' }),
          screen.getByRole('article', { name: 'Second' }),
        ]),
      )

      await finishAll(animations)
      await user.click(screen.getByRole('button', { name: 'Collapse all' }))

      expect(screen.getByText('First details.')).toBeVisible()
      expect(screen.getByText('Second details.')).toBeVisible()

      await finishAll(animations)

      expect(screen.getByText('First details.')).not.toBeVisible()
      expect(screen.getByText('Second details.')).not.toBeVisible()
    })
  })

  describe('default state', () => {
    it('is open when expanded by default', () => {
      render(
        <Tile title="Master’s degree" defaultExpanded>
          <p>Thesis on compilers.</p>
        </Tile>,
      )

      expect(
        screen.getByRole('button', { name: 'Master’s degree' }),
      ).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByText('Thesis on compilers.')).toBeVisible()
    })

    it('is open when expanded by default in a section, and counts as open', () => {
      renderInSection([
        <Tile key="a" title="First" defaultExpanded>
          <p>First details.</p>
        </Tile>,
        <Tile key="b" title="Second" defaultExpanded>
          <p>Second details.</p>
        </Tile>,
      ])

      expect(screen.getByText('First details.')).toBeVisible()
      expect(
        screen.getByRole('button', { name: 'Collapse all' }),
      ).toBeInTheDocument()
    })
  })

  describe('in a section', () => {
    it('opens and closes together with the other top-level tiles', async () => {
      const user = userEvent.setup()
      renderInSection([
        <Tile key="a" title="First">
          <p>First details.</p>
        </Tile>,
        <Tile key="b" title="Second">
          <p>Second details.</p>
        </Tile>,
      ])

      await user.click(screen.getByRole('button', { name: 'Expand all' }))

      expect(screen.getByText('First details.')).toBeVisible()
      expect(screen.getByText('Second details.')).toBeVisible()

      await user.click(screen.getByRole('button', { name: 'Collapse all' }))

      expect(screen.getByText('First details.')).not.toBeVisible()
      expect(screen.getByText('Second details.')).not.toBeVisible()
    })

    it('can still be toggled on its own after expanding all', async () => {
      const user = userEvent.setup()
      renderInSection([
        <Tile key="a" title="First">
          <p>First details.</p>
        </Tile>,
        <Tile key="b" title="Second">
          <p>Second details.</p>
        </Tile>,
      ])

      await user.click(screen.getByRole('button', { name: 'Expand all' }))
      await user.click(screen.getByRole('button', { name: 'First' }))

      expect(screen.getByText('First details.')).not.toBeVisible()
      expect(screen.getByText('Second details.')).toBeVisible()
    })

    it('does not count nested tiles towards the expand all button', () => {
      renderInSection([
        <Tile key="a" title="Parent">
          <Tile title="Project one" headingLevel={4}>
            <p>One details.</p>
          </Tile>
          <Tile title="Project two" headingLevel={4}>
            <p>Two details.</p>
          </Tile>
        </Tile>,
      ])

      expect(
        screen.queryByRole('button', { name: 'Expand all' }),
      ).not.toBeInTheDocument()
    })

    it('leaves nested tiles closed when expanding all', async () => {
      const user = userEvent.setup()
      renderInSection([
        <Tile key="a" title="First">
          <Tile title="Project" headingLevel={4}>
            <p>Project details.</p>
          </Tile>
        </Tile>,
        <Tile key="b" title="Second">
          <p>Second details.</p>
        </Tile>,
      ])

      await user.click(screen.getByRole('button', { name: 'Expand all' }))

      expect(screen.getByRole('button', { name: 'Project' })).toHaveAttribute(
        'aria-expanded',
        'false',
      )
      expect(screen.getByText('Second details.')).toBeVisible()
    })

    it('starts counting once it gets content to expand', () => {
      const tile = (details: boolean) => [
        <Tile key="a" title="First">
          <p>First details.</p>
        </Tile>,
        <Tile key="b" title="Second">
          {details && <p>Second details.</p>}
        </Tile>,
      ]
      const { rerender } = renderInSection(tile(false))
      expect(
        screen.queryByRole('button', { name: 'Expand all' }),
      ).not.toBeInTheDocument()

      rerender(
        <LocaleProvider initialLocale="en">
          <ResumeSection
            title="Things"
            icon={<svg />}
            state={{ status: 'loaded', value: tile(true) }}
            getKey={(t) => t.props.title}
            renderTile={(t) => t}
          />
        </LocaleProvider>,
      )

      expect(
        screen.getByRole('button', { name: 'Expand all' }),
      ).toBeInTheDocument()
    })

    it('does not count tiles without content towards the expand all button', () => {
      renderInSection([
        <Tile key="a" title="First">
          <p>First details.</p>
        </Tile>,
        <Tile key="b" title="Second" subtitle="Nothing to expand" />,
      ])

      expect(
        screen.queryByRole('button', { name: 'Expand all' }),
      ).not.toBeInTheDocument()
    })
  })

  describe('row look', () => {
    it('is a row when its section is a row section', () => {
      renderInSection(
        [
          <Tile key="a" title="First">
            <p>First details.</p>
          </Tile>,
        ],
        'row',
      )

      expect(screen.getByRole('article', { name: 'First' })).toHaveClass(
        'tile--row',
      )
    })

    it('is not a row when its section is a card section', () => {
      renderInSection([
        <Tile key="a" title="First">
          <p>First details.</p>
        </Tile>,
      ])

      expect(screen.getByRole('article', { name: 'First' })).not.toHaveClass(
        'tile--row',
      )
    })

    it('is not a row outside any section', () => {
      render(<Tile title="First" />)

      expect(screen.getByRole('article')).not.toHaveClass('tile--row')
    })

    it('is not a row when nested, even in a row section', () => {
      renderInSection(
        [
          <Tile key="a" title="Parent">
            <Tile title="Project" headingLevel={4}>
              <p>Project details.</p>
            </Tile>
          </Tile>,
        ],
        'row',
      )

      expect(screen.getByRole('article', { name: 'Parent' })).toHaveClass(
        'tile--row',
      )
      expect(
        screen.getByRole('article', { name: 'Project', hidden: true }),
      ).not.toHaveClass('tile--row')
    })
  })
})
