import { act, render, screen } from '@testing-library/react'
import type { ContactLink } from '@/domain/contact/ContactLink'
import type { Locale } from '@/domain/i18n/Locale'
import {
  failingContactRepository,
  fakeContactRepository,
  pendingContactRepository,
} from '@/test/fakeContactRepository'
import {
  failingProfileRepository,
  fakeProfileRepository,
  pendingProfileRepository,
} from '@/test/fakeProfileRepository'
import type { ContactRepository } from '@/domain/contact/ContactRepository'
import type { ProfileRepository } from '@/domain/profile/ProfileRepository'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import { ResumePrintHeader } from '@/ui/resume/ResumePrintHeader'

function renderHeader(
  profileRepository: ProfileRepository = fakeProfileRepository(),
  contactRepository: ContactRepository = fakeContactRepository(),
  locale: Locale = 'en',
) {
  return render(
    <LocaleProvider initialLocale={locale}>
      <ResumePrintHeader
        profileRepository={profileRepository}
        contactRepository={contactRepository}
      />
    </LocaleProvider>,
  )
}

describe('ResumePrintHeader', () => {
  it('shows the full name', async () => {
    renderHeader()

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
  })

  it('shows the headline in English', async () => {
    renderHeader()

    expect(await screen.findByText('Analyst')).toBeInTheDocument()
  })

  it('shows the headline in French', async () => {
    renderHeader(fakeProfileRepository(), fakeContactRepository(), 'fr')

    expect(await screen.findByText('Analyste')).toBeInTheDocument()
  })

  it('adds no heading, so the page keeps its single main heading', async () => {
    renderHeader()

    await screen.findByText('Ada Lovelace')
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('writes an email out as its address, without mailto:', async () => {
    renderHeader()

    const link = await screen.findByRole('link', { name: 'ada@example.com' })
    expect(link).toHaveAttribute('href', 'mailto:ada@example.com')
  })

  it('writes the other links out as their URL, without the scheme or www.', async () => {
    renderHeader()

    expect(await screen.findByRole('link', { name: 'linkedin.com/in/ada' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'github.com/ada' })).toBeInTheDocument()
  })

  it('drops the trailing slash of a website', async () => {
    const links: ContactLink[] = [{ kind: 'website', url: 'https://www.ada.dev/' }]
    renderHeader(fakeProfileRepository(), fakeContactRepository(links))

    expect(await screen.findByRole('link', { name: 'ada.dev' })).toBeInTheDocument()
  })

  it('writes a link of another kind out as its URL, without the scheme', async () => {
    const links: ContactLink[] = [{ kind: 'other', url: 'https://blog.ada.dev/' }]
    renderHeader(fakeProfileRepository(), fakeContactRepository(links))

    expect(await screen.findByRole('link', { name: 'blog.ada.dev' })).toBeInTheDocument()
  })

  it('drops http:// from a URL without www.', async () => {
    const links: ContactLink[] = [{ kind: 'website', url: 'http://ada.dev/about' }]
    renderHeader(fakeProfileRepository(), fakeContactRepository(links))

    expect(await screen.findByRole('link', { name: 'ada.dev/about' })).toBeInTheDocument()
  })

  it('shows the name and headline alone when the contact links fail', async () => {
    renderHeader(fakeProfileRepository(), failingContactRepository())

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('Analyst')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows the name and headline while the contact links are loading', async () => {
    renderHeader(fakeProfileRepository(), pendingContactRepository())

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('Analyst')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows nothing once the profile has failed', async () => {
    const { container } = renderHeader(failingProfileRepository())

    await act(async () => {})

    expect(container).toBeEmptyDOMElement()
  })

  it('shows nothing while the profile is loading', () => {
    const { container } = renderHeader(pendingProfileRepository())

    expect(container).toBeEmptyDOMElement()
  })
})
