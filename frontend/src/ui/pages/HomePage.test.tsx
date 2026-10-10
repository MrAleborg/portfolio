import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import type { Locale } from '@/domain/i18n/Locale'
import type { ProfessionalExperience } from '@/domain/professionalExperience/ProfessionalExperience'
import type { ProfessionalExperienceRepository } from '@/domain/professionalExperience/ProfessionalExperienceRepository'
import type { ProfileRepository } from '@/domain/profile/ProfileRepository'
import {
  fakeProfessionalExperienceRepository,
  fullExperience,
} from '@/test/fakeProfessionalExperienceRepository'
import { failing, pending } from '@/test/fakeList'
import {
  ada,
  failingProfileRepository,
  fakeProfileRepository,
  pendingProfileRepository,
} from '@/test/fakeProfileRepository'
import { LanguageSwitch } from '@/ui/components/LanguageSwitch'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import { HomePage } from '@/ui/pages/HomePage'

function renderPage(
  repository: ProfileRepository,
  locale: Locale = 'en',
  experienceRepository: ProfessionalExperienceRepository = fakeProfessionalExperienceRepository(),
) {
  return render(
    <MemoryRouter>
      <LocaleProvider initialLocale={locale}>
        <HomePage profileRepository={repository} experienceRepository={experienceRepository} />
      </LocaleProvider>
    </MemoryRouter>,
  )
}

describe('HomePage', () => {
  it('says the profile is loading', () => {
    renderPage(pendingProfileRepository())

    expect(screen.getByRole('status')).toHaveTextContent('Loading…')
  })

  describe('in English', () => {
    it('shows the full name as the main heading', async () => {
      renderPage(fakeProfileRepository())

      expect(
        await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' }),
      ).toBeInTheDocument()
    })

    it('shows the headline', async () => {
      renderPage(fakeProfileRepository())

      expect(await screen.findByText('Analyst')).toBeInTheDocument()
    })

    it('shows the bio', async () => {
      renderPage(fakeProfileRepository())

      expect(await screen.findByText('I write programs.')).toBeInTheDocument()
    })

    it('shows the avatar', async () => {
      renderPage(fakeProfileRepository())

      expect(
        await screen.findByRole('img', { name: 'Portrait of Ada Lovelace' }),
      ).toBeInTheDocument()
    })

    it('first requests the avatar photo served from /media', async () => {
      renderPage(fakeProfileRepository())

      expect(
        await screen.findByRole('img', { name: 'Portrait of Ada Lovelace' }),
      ).toHaveAttribute('src', '/media/avatar.webp')
    })

    it('links to the resume with a primary call to action', async () => {
      renderPage(fakeProfileRepository())

      expect(await screen.findByRole('link', { name: 'See my resume' })).toHaveAttribute(
        'href',
        '/resume',
      )
    })

    it('links to the contact page with a secondary call to action', async () => {
      renderPage(fakeProfileRepository())

      expect(await screen.findByRole('link', { name: 'Get in touch' })).toHaveAttribute(
        'href',
        '/contact',
      )
    })

    it('says when the profile could not be loaded', async () => {
      renderPage(failingProfileRepository())

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'The profile could not be loaded. Please try again later.',
      )
    })
  })

  describe('in French', () => {
    it('shows the headline', async () => {
      renderPage(fakeProfileRepository(), 'fr')

      expect(await screen.findByText('Analyste')).toBeInTheDocument()
    })

    it('shows the bio', async () => {
      renderPage(fakeProfileRepository(), 'fr')

      expect(
        await screen.findByText('J’écris des programmes.'),
      ).toBeInTheDocument()
    })

    it('elides "de" in the avatar text before a vowel', async () => {
      renderPage(fakeProfileRepository(), 'fr')

      expect(
        await screen.findByRole('img', { name: 'Portrait d’Ada Lovelace' }),
      ).toBeInTheDocument()
    })

    it('keeps "de" in the avatar text before a consonant', async () => {
      renderPage(fakeProfileRepository({ ...ada, fullName: 'Grace Hopper' }), 'fr')

      expect(
        await screen.findByRole('img', { name: 'Portrait de Grace Hopper' }),
      ).toBeInTheDocument()
    })

    it('links to the resume with a primary call to action', async () => {
      renderPage(fakeProfileRepository(), 'fr')

      expect(await screen.findByRole('link', { name: 'Voir mon CV' })).toHaveAttribute(
        'href',
        '/resume',
      )
    })

    it('links to the contact page with a secondary call to action', async () => {
      renderPage(fakeProfileRepository(), 'fr')

      expect(await screen.findByRole('link', { name: 'Me contacter' })).toHaveAttribute(
        'href',
        '/contact',
      )
    })

    it('says when the profile could not be loaded', async () => {
      renderPage(failingProfileRepository(), 'fr')

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Le profil n’a pas pu être chargé. Réessayez plus tard.',
      )
    })
  })

  it('shows each paragraph of the bio apart', async () => {
    renderPage(
      fakeProfileRepository({
        ...ada,
        bio: { en: 'First paragraph.\n\nSecond paragraph.', fr: '' },
      }),
    )

    expect(await screen.findByText('First paragraph.')).toBeInTheDocument()
    expect(screen.getByText('Second paragraph.')).toBeInTheDocument()
  })

  it('shows a repeated paragraph each time, and no stale one after a language switch', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <LocaleProvider initialLocale="en">
          <LanguageSwitch />
          <HomePage
            experienceRepository={fakeProfessionalExperienceRepository()}
            profileRepository={fakeProfileRepository({
              ...ada,
              bio: { en: 'Same.\n\nSame.', fr: 'Other.\n\nSame.' },
            })}
          />
        </LocaleProvider>
      </MemoryRouter>,
    )
    expect(await screen.findAllByText('Same.')).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Français' }))

    expect(
      screen.getAllByText(/Same|Other/).map((paragraph) => paragraph.textContent),
    ).toEqual(['Other.', 'Same.'])
  })

  describe('key facts', () => {
    it('shows the facts under the calls to action once the experiences have loaded', async () => {
      renderPage(fakeProfileRepository())

      expect(await screen.findByLabelText('Key facts')).toBeInTheDocument()
      expect(screen.getByText('Consultant at Globex')).toBeInTheDocument()
    })

    it('shows the desired role of the profile when no job is ongoing', async () => {
      const finished: ProfessionalExperience = {
        ...fullExperience,
        period: { start: '2019-09-01', end: '2022-08-31' },
      }
      renderPage(
        fakeProfileRepository(),
        'en',
        fakeProfessionalExperienceRepository([finished]),
      )

      expect(await screen.findByText('Engineer')).toBeInTheDocument()
    })

    it('shows the profile and the calls to action while the experiences are loading, without facts', async () => {
      renderPage(fakeProfileRepository(), 'en', { list: pending<ProfessionalExperience>() })

      expect(await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'See my resume' })).toBeInTheDocument()
      expect(screen.queryByLabelText('Key facts')).not.toBeInTheDocument()
    })

    it('shows the profile and the calls to action without facts or alert when the experiences fail to load', async () => {
      renderPage(fakeProfileRepository(), 'en', { list: failing<ProfessionalExperience>() })

      expect(await screen.findByRole('heading', { level: 1, name: 'Ada Lovelace' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Get in touch' })).toBeInTheDocument()
      expect(screen.queryByLabelText('Key facts')).not.toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })
})
