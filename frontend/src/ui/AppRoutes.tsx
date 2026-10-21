import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router'
import { LOCALES, type Locale } from '@/domain/i18n/Locale'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import { preferredLocale } from '@/ui/i18n/preferredLocale'
import { withoutLocale } from '@/ui/i18n/withoutLocale'
import { Layout } from '@/ui/layout/Layout'
import { ContactPage } from '@/ui/pages/ContactPage'
import { HomePage } from '@/ui/pages/HomePage'
import { NotFoundPage } from '@/ui/pages/NotFoundPage'
import { ResumePage } from '@/ui/pages/ResumePage'
import type { Repositories } from '@/ui/Repositories'

interface AppRoutesProps {
  repositories: Repositories
}

// The address decides the Locale, so every Page lives under `/fr` or `/en`.
function LocaleRoute({ locale, children }: { locale: Locale; children: ReactNode }) {
  const { pathname, search, hash } = useLocation()
  const navigate = useNavigate()
  // An address with no Locale prefix (the not-found Page) gets one.
  const unprefixed = withoutLocale(pathname)
  // Keeps the Page and swaps the Locale. The scroll is kept: the visitor stays where they were.
  // Replaces the history entry, so Back does not just undo the switch.
  const onSwitch = (next: Locale) =>
    navigate(
      { pathname: `/${next}${unprefixed}`, search, hash },
      { replace: true, state: { keepScroll: true } },
    )

  return (
    <LocaleProvider locale={locale} onSwitch={onSwitch}>
      {children}
    </LocaleProvider>
  )
}

// Read when the route renders, so a language switched to since the app loaded counts.
function RootRedirect() {
  return <Navigate to={`/${preferredLocale()}/`} replace />
}

// The old links, from before the Locale was in the address.
function EnglishRedirect({ page }: { page: 'resume' | 'contact' }) {
  const { search, hash } = useLocation()
  return <Navigate to={{ pathname: `/en/${page}`, search, hash }} replace />
}

export function AppRoutes({ repositories }: AppRoutesProps) {
  const layout = (locale: Locale) => (
    <LocaleRoute locale={locale}>
      <Layout
        profileRepository={repositories.profile}
        contactRepository={repositories.contact}
      />
    </LocaleRoute>
  )
  const notFound = <Route path="*" element={<NotFoundPage />} />

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="resume" element={<EnglishRedirect page="resume" />} />
      <Route path="contact" element={<EnglishRedirect page="contact" />} />
      {/* Case-sensitive, as nginx is: `/EN/resume` is a page that does not exist. */}
      {LOCALES.map((locale) => (
        <Route key={locale} path={locale} caseSensitive element={layout(locale)}>
          <Route
            index
            element={
              <HomePage
                profileRepository={repositories.profile}
                experienceRepository={repositories.experience}
              />
            }
          />
          <Route
            path="resume"
            element={<ResumePage repositories={repositories} />}
          />
          <Route
            path="contact"
            element={<ContactPage contactRepository={repositories.contact} />}
          />
          {notFound}
        </Route>
      ))}
      {/* No Locale in the address: English, as nginx does. */}
      <Route element={layout('en')}>{notFound}</Route>
    </Routes>
  )
}
