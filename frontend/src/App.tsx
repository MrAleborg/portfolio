import { BrowserRouter } from 'react-router'
import { AppRoutes } from '@/ui/AppRoutes'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import type { Repositories } from '@/ui/Repositories'

interface AppProps {
  repositories: Repositories
}

function App({ repositories }: AppProps) {
  return (
    <LocaleProvider>
      <BrowserRouter>
        <AppRoutes repositories={repositories} />
      </BrowserRouter>
    </LocaleProvider>
  )
}

export default App
