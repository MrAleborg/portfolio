import { NavLink, Outlet, useLocation } from 'react-router'
import { ErrorBoundary } from '@/ui/components/ErrorBoundary'
import { SettingsMenu } from '@/ui/components/SettingsMenu'
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
          <NavLink to="/contact">{text.navContact}</NavLink>
        </nav>
        <SettingsMenu />
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
