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

  it('joins its meta items with a middle dot', () => {
    render(<Tile title="Master’s degree" meta={['Sep 2015 – Jun 2017', 'Brittany']} />)

    expect(screen.getByText('Sep 2015 – Jun 2017 · Brittany')).toBeInTheDocument()
  })

  it('leaves out empty meta items', () => {
    render(<Tile title="Master’s degree" meta={['Sep 2015 – Jun 2017', '']} />)

    expect(screen.getByText('Sep 2015 – Jun 2017')).toBeInTheDocument()
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

  it('has no button when it has no content to expand', () => {
    render(<Tile title="Master’s degree" subtitle="Université de Rennes" />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('has no button when its content is an empty list', () => {
    render(<Tile title="Master’s degree">{[]}</Tile>)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows nothing but its title when it has nothing else', () => {
    render(<Tile title="Master’s degree" meta={['']} />)

    expect(screen.getByRole('article')).toHaveTextContent(/^Master’s degree$/)
  })
})
