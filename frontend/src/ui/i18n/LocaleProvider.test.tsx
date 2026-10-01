import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageSwitch } from '@/ui/components/LanguageSwitch'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'

function renderSwitch() {
  return render(
    <LocaleProvider>
      <LanguageSwitch />
    </LocaleProvider>,
  )
}

beforeEach(() => {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-US'])
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('LocaleProvider', () => {
  it('opens in the language the visitor chose last time', async () => {
    const user = userEvent.setup()
    const first = renderSwitch()
    await user.click(screen.getByRole('button', { name: 'Français' }))
    first.unmount()

    renderSwitch()

    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('lang', 'fr')
  })

  it('follows the browser language until the visitor chooses one', () => {
    const first = renderSwitch()
    expect(screen.getByRole('button', { name: 'Français' })).toBeInTheDocument()
    first.unmount()
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fr-FR'])

    renderSwitch()

    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument()
  })

  it('ignores a stored language that is not supported', () => {
    localStorage.setItem('locale', 'de')

    renderSwitch()

    expect(screen.getByRole('button', { name: 'Français' })).toBeInTheDocument()
  })

  it('still switches language when the storage is unavailable', async () => {
    const user = userEvent.setup()
    const denied = () => {
      throw new DOMException('denied', 'SecurityError')
    }
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(denied)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(denied)
    renderSwitch()

    await user.click(screen.getByRole('button', { name: 'Français' }))

    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument()
  })
})
