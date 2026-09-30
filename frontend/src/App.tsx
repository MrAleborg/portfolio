import { BrowserRouter } from 'react-router'
import type { ProfileRepository } from '@/domain/profile/ProfileRepository'
import { AppRoutes } from '@/ui/AppRoutes'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'

interface AppProps {
  profileRepository: ProfileRepository
}

function App({ profileRepository }: AppProps) {
  return (
    <LocaleProvider>
      <BrowserRouter>
        <AppRoutes profileRepository={profileRepository} />
      </BrowserRouter>
    </LocaleProvider>
  )
}

export default App
