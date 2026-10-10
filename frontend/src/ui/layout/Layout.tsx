import { useEffect, useLayoutEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigationType } from 'react-router'
import type { ProfileRepository } from '@/domain/profile/ProfileRepository'
import { useAsync } from '@/ui/async/useAsync'
import { ErrorBoundary } from '@/ui/components/ErrorBoundary'
import { SettingsMenu } from '@/ui/components/SettingsMenu'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import './Layout.css'

interface LayoutProps {
  profileRepository: ProfileRepository
}

export function Layout({ profileRepository }: LayoutProps) {
  const text = messages[useLocale().locale]
  const { pathname, hash, key } = useLocation()
  const navigationType = useNavigationType()
  const profile = useAsync(profileRepository.get)
  const sentinel = useRef<HTMLDivElement>(null)
  const header = useRef<HTMLElement>(null)

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
  // the browser, and a link to a section (`#…`) to the page, which scrolls there itself. The
  // location's key changes on every navigation, including a second click on the current page.
  useLayoutEffect(() => {
    if (navigationType !== 'POP' && !hash) window.scrollTo(0, 0)
  }, [key, navigationType, hash])

  return (
    <div className="layout">
      <div ref={sentinel} className="layout__sentinel" aria-hidden="true" />
      <header ref={header} className="layout__header">
        {profile.status === 'loaded' && (
          <Link to="/" className="layout__mark">
            {profile.value.fullName}
          </Link>
        )}
        <div className="layout__actions">
          <nav aria-label={text.navLabel} className="layout__nav">
            <NavLink to="/resume">{text.navResume}</NavLink>
            <NavLink to="/contact">{text.navContact}</NavLink>
          </nav>
          <SettingsMenu />
        </div>
      </header>
      <main className="layout__main">
        {/* Keyed by path, so leaving a failed page shows the next one. */}
        <ErrorBoundary
          key={pathname}
          fallback={<p role="alert">{text.pageError}</p>}
        >
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  )
}
