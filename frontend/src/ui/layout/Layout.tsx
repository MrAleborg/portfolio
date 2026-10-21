import { useEffect, useLayoutEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigationType } from 'react-router'
import type { ContactRepository } from '@/domain/contact/ContactRepository'
import type { ProfileRepository } from '@/domain/profile/ProfileRepository'
import { useAsync } from '@/ui/async/useAsync'
import { ErrorBoundary } from '@/ui/components/ErrorBoundary'
import { SettingsMenu } from '@/ui/components/SettingsMenu'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { withoutLocale } from '@/ui/i18n/withoutLocale'
import { Footer } from '@/ui/layout/Footer'
import './Layout.css'

interface LayoutProps {
  profileRepository: ProfileRepository
  contactRepository: ContactRepository
}

const GENERIC_TITLE = 'Alexandre Le Borgne'

export function Layout({ profileRepository, contactRepository }: LayoutProps) {
  const { locale } = useLocale()
  const text = messages[locale]
  const { pathname, hash, key, state } = useLocation()
  const navigationType = useNavigationType()
  const profile = useAsync(profileRepository.get)
  const sentinel = useRef<HTMLDivElement>(null)
  const header = useRef<HTMLElement>(null)

  // The tab title mirrors the Page summary titles of backend/owner/page_summary.py: keep them in step.
  // While the Profile loads, the shell's title (set by nginx, or generic) stays. If it fails, the title is generic.
  const page = withoutLocale(pathname).replace(/^\/|\/$/g, '')
  // A Map, so a page named `constructor` is not found among the object prototype's keys.
  const pageNames = new Map([
    ['resume', text.navResume],
    ['contact', text.navContact],
  ])
  const pageName = page ? (pageNames.get(page) ?? text.notFoundTitle) : undefined
  const title =
    profile.status === 'error'
      ? GENERIC_TITLE
      : profile.status !== 'loaded'
        ? undefined
        : pageName
          ? `${pageName} – ${profile.value.fullName}`
          : `${profile.value.fullName} – ${profile.value.headline[locale]}`
  useEffect(() => {
    if (title) document.title = title
  }, [title])

  // The header gains its bottom border once the top of the page has scrolled out of view.
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const atTop = entries.at(-1)?.isIntersecting ?? true
      header.current?.toggleAttribute('data-scrolled', !atTop)
    })
    if (sentinel.current) observer.observe(sentinel.current)
    return () => observer.disconnect()
  }, [])

  // A followed link opens the page at its top, before it is painted. Back and forward are left to
  // the browser, and a link to a section (`#…`) to the page, which scrolls there itself. So is a
  // language switch, which keeps the visitor in place. The location's key changes on every
  // navigation, including a second click on the current page.
  const keepScroll = Boolean(state?.keepScroll)
  useLayoutEffect(() => {
    if (navigationType !== 'POP' && !hash && !keepScroll) window.scrollTo(0, 0)
  }, [key, navigationType, hash, keepScroll])

  return (
    <div className="layout">
      <div ref={sentinel} className="layout__sentinel" aria-hidden="true" />
      <header ref={header} className="layout__header">
        {profile.status === 'loaded' && (
          <Link to={`/${locale}/`} className="layout__mark">
            {profile.value.fullName}
          </Link>
        )}
        <div className="layout__actions">
          <nav aria-label={text.navLabel} className="layout__nav">
            <NavLink to={`/${locale}/resume`}>{text.navResume}</NavLink>
            <NavLink to={`/${locale}/contact`}>{text.navContact}</NavLink>
          </nav>
          <SettingsMenu />
        </div>
      </header>
      <main className="layout__main">
        {/* Keyed by path without its Locale, so leaving a failed page shows the next one, while switching language keeps the page. */}
        <ErrorBoundary
          key={withoutLocale(pathname)}
          fallback={<p role="alert">{text.pageError}</p>}
        >
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer
        fullName={profile.status === 'loaded' ? profile.value.fullName : undefined}
        contactRepository={contactRepository}
      />
    </div>
  )
}
