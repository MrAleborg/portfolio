import { render, screen } from '@testing-library/react'
import App from '@/App'
import { fakeRepositories } from '@/test/fakeRepositories'

describe('App', () => {
  it("shows the owner's home page", async () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-US'])

    render(<App repositories={fakeRepositories()} />)

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Analyst')).toBeInTheDocument()
  })
})
