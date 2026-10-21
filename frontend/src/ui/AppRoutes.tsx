import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router'
import { isLocale, type Locale } from '@/domain/i18n/Locale'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import { preferredLocale } from '@/ui/i18n/preferredLocale'
import { Layout } from '@/ui/layout/Layout'
import { ContactPage } from '@/ui/pages/ContactPage'
import { HomePage } from '@/ui/pages/HomePage'
import { ResumePage } from '@/ui/pages/ResumePage'
import type { Repositories } from '@/ui/Repositories'

interface AppRoutesProps {
  repositories: Repositories
}

// The address decides the Locale, so every Page lives under `/fr` or `/en`.
function LocaleRoute({ children }: { children: ReactNode }) {
  const { locale } = useParams()
  const { pathname, search, hash } = useLocation()
  const navigate = useNavigate()
  // Keeps the Page and swaps the Locale. The scroll is kept: the visitor stays where they were.
  // Replaces the history entry, so Back does not just undo the switch.
  const onSwitch = (next: Locale) =>
    navigate(
      { pathname: pathname.replace(/^\/[^/]+/, `/${next}`), search, hash },
      { replace: true, state: { keepScroll: true } },
    )

  if (!locale || !isLocale(locale)) return <Navigate to="/" replace />
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
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="resume" element={<EnglishRedirect page="resume" />} />
      <Route path="contact" element={<EnglishRedirect page="contact" />} />
      <Route
        path=":locale"
        element={
          <LocaleRoute>
            <Layout
              profileRepository={repositories.profile}
              contactRepository={repositories.contact}
            />
          </LocaleRoute>
        }
      >
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
