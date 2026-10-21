import { BrowserRouter } from 'react-router'
import { AppRoutes } from '@/ui/AppRoutes'
import type { Repositories } from '@/ui/Repositories'

interface AppProps {
  repositories: Repositories
}

function App({ repositories }: AppProps) {
  return (
    <BrowserRouter>
      <AppRoutes repositories={repositories} />
    </BrowserRouter>
  )
}

export default App
