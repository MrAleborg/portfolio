import { NavLink, Outlet, useLocation } from 'react-router'
import { ErrorBoundary } from '@/ui/components/ErrorBoundary'
import { LanguageSwitch } from '@/ui/components/LanguageSwitch'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import './Layout.css'

export function Layout() {
  const text = messages[useLocale().locale]
  const { pathname } = useLocation()

  return (
    <div className="layout">
      <header className="layout__header">
        <nav aria-label={text.navLabel} className="layout__nav">
          <NavLink to="/" end>
            {text.navHome}
          </NavLink>
          <NavLink to="/resume">{text.navResume}</NavLink>
        </nav>
        <LanguageSwitch />
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
