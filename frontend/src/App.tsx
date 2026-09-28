import { owner } from '@/infrastructure/profile/staticProfile'
import { LocaleProvider } from '@/ui/i18n/LocaleProvider'
import { WelcomePage } from '@/ui/pages/WelcomePage'

function App() {
  return (
    <LocaleProvider>
      <WelcomePage profile={owner} />
    </LocaleProvider>
  )
}

export default App
