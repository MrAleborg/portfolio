import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tile } from '@/ui/components/Tile'

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

describe('Tile', () => {
  it('is an article named by its title', () => {
    render(<Tile title="Master’s degree" />)

    expect(
      screen.getByRole('article', { name: 'Master’s degree' }),
    ).toBeInTheDocument()
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
})
