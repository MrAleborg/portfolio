import { render, screen } from '@testing-library/react'
import App from '@/App'

describe('App', () => {
  it("shows the owner's welcome page", () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-US'])

    render(<App />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Alexandre Le Borgne' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Senior Software Engineer, PhD'),
    ).toBeInTheDocument()
  })
})
